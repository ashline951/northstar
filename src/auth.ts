import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { getActiveUser } from "@/lib/users";

/** Profile photo size requested from Graph. Kept small: it rides in the
 *  session cookie, which Auth.js has to chunk past ~4KB. */
const PHOTO_PX = 64;

type GraphMe = {
  givenName?: string | null;
  surname?: string | null;
  jobTitle?: string | null;
  department?: string | null;
};

async function fetchGraphProfile(accessToken: string) {
  const headers = { Authorization: `Bearer ${accessToken}` };

  let me: GraphMe = {};
  try {
    const res = await fetch(
      "https://graph.microsoft.com/v1.0/me?$select=givenName,surname,jobTitle,department",
      { headers }
    );
    if (res.ok) me = await res.json();
  } catch (err) {
    console.error("northstar: Graph profile fetch failed", err);
  }

  // Plenty of accounts have no photo; a 404 here is normal, not an error.
  let picture: string | null = null;
  try {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/photos/${PHOTO_PX}x${PHOTO_PX}/$value`,
      { headers }
    );
    if (res.ok) {
      const buf = Buffer.from(await res.arrayBuffer());
      picture = `data:image/jpeg;base64,${buf.toString("base64")}`;
    }
  } catch {
    // falls back to an initials avatar
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
  ...authConfig,
  callbacks: {
    /**
     * Northstar's access gate. Entra authenticates anyone in the tenant; only
     * people on the roster get a session. Returning a path sends them to a
     * page that explains it rather than a generic auth error.
     */
    async signIn({ profile }) {
      const raw = profile?.email ?? profile?.preferred_username;
      const email = typeof raw === "string" ? raw : null;
      return (await getActiveUser(email)) ? true : "/not-authorized";
    },

    async jwt({ token, account }) {
      // Only on initial sign-in, when there is an access token to spend.
      if (account?.access_token) {
        const p = await fetchGraphProfile(account.access_token);
        token.givenName = p.givenName;
        token.surname = p.surname;
        token.jobTitle = p.jobTitle;
        token.department = p.department;
        token.picture = p.picture;

        const user = await getActiveUser(token.email);
        token.role = user?.role ?? null;
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
