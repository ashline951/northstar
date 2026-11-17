import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const tenantId = process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID;

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      // Single-tenant. Swap the tenant id to move between the dev tenant and LLUH.
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      // The provider default is "openid profile email User.Read". User.Read is only
      // used to fetch a Graph profile photo; we drop it to keep the app registration
      // minimal, and override profile() accordingly.
      authorization: { params: { scope: "openid profile email" } },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
});
