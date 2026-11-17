import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

const tenantId = process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID;

/**
 * The edge-safe half of the Auth.js config, used by middleware, which only
 * needs to verify a session cookie. Anything that touches the database lives
 * in auth.ts so the Neon driver never has to run in middleware.
 */
export default {
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
      // User.Read gives job title, department and the profile photo.
      authorization: { params: { scope: "openid profile email User.Read" } },
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
  pages: { signIn: "/signin", signOut: "/signed-out" },
  callbacks: {
    /**
     * THE ROUTE GUARD. Without this, exporting `auth` as middleware only
     * attaches session info to the request and blocks nothing - every page,
     * including /admin, answers 200 to anonymous callers. Returning false
     * sends them to pages.signIn.
     *
     * Lives here rather than in auth.ts because middleware is built from this
     * edge-safe config.
     */
    authorized({ auth }) {
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;
