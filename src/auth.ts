import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { isAllowed, roleForEmail } from "@/lib/roles";

const tenantId = process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID;

/** Profile photo size requested from Graph. Kept small: it is stored in the
 *  session cookie, and Auth.js has to chunk the cookie past ~4KB. */
const PHOTO_PX = 64;

type GraphMe = {
  givenName?: string | null;
  surname?: string | null;
  jobTitle?: string | null;
  department?: string | null;
  mail?: string | null;
  userPrincipalName?: string | null;
};

async function fetchGraphProfile(accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  const meRes = await fetch(
    "https://graph.microsoft.com/v1.0/me?$select=givenName,surname,jobTitle,department,mail,userPrincipalName",
    { headers }
  );
  const me: GraphMe = meRes.ok ? await meRes.json() : {};

  // Not every account has a photo; a 404 here is normal, not an error.
  let picture: string | null = null;
  try {
    const photoRes = await fetch(
      `https://graph.microsoft.com/v1.0/me/photos/${PHOTO_PX}x${PHOTO_PX}/$value`,
      { headers }
    );
    if (photoRes.ok) {
      const buf = Buffer.from(await photoRes.arrayBuffer());
      picture = `data:image/jpeg;base64,${buf.toString("base64")}`;
    }
  } catch {
    // fall through to initials avatar
  }

  return {
    givenName: me.givenName ?? null,
    surname: me.surname ?? null,
    jobTitle: me.jobTitle ?? null,
    department: me.department ?? null,
    picture,
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      // User.Read is needed for job title, department and profile photo.
      authorization: { params: { scope: "openid profile email User.Read" } },
      // Default profile() fetches a photo via Graph; we do that ourselves in
      // the jwt callback where we also pick up title and department.
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email ?? profile.preferred_username,
          image: null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signOut: "/signed-out" },
  callbacks: {
    /**
     * Northstar's access gate. Entra will authenticate anyone in the tenant;
     * only people on the allow list get a session. Returning a path sends
     * them to a page that explains it rather than a generic auth error.
     */
    async signIn({ profile }) {
      const email = profile?.email ?? profile?.preferred_username;
      return isAllowed(typeof email === "string" ? email : null)
        ? true
        : "/not-authorized";
    },
    async jwt({ token, account }) {
      // Only on initial sign-in, when we have an access token to spend.
      if (account?.access_token) {
        const p = await fetchGraphProfile(account.access_token);
        token.givenName = p.givenName;
        token.surname = p.surname;
        token.jobTitle = p.jobTitle;
        token.department = p.department;
        token.picture = p.picture;
        token.role = roleForEmail(token.email);
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as Record<string, string | null | undefined>;
      session.user.givenName = t.givenName ?? null;
      session.user.surname = t.surname ?? null;
      session.user.jobTitle = t.jobTitle ?? null;
      session.user.department = t.department ?? null;
      session.user.image = t.picture ?? null;
      session.user.role = t.role ?? null;
      return session;
    },
  },
});
