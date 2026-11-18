import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Deliberately built from the edge-safe config: middleware only needs to
// verify the session cookie, and must not pull the database driver in.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Everything requires sign-in except Next internals, the auth routes, the
  // public signed-out / not-authorized pages, and static brand assets.
  matcher: [
    // /mcp and /oauth/* are excluded because they authenticate themselves.
    // /oauth/authorize still REQUIRES a Northstar session - it calls auth()
    // and redirects to /signin - but it must validate the client and redirect
    // URI first, so a bogus client is refused outright instead of being sent
    // through sign-in only to fail afterwards.
    "/((?!api/auth|signin|signed-out|not-authorized|mcp|oauth|[.]well-known|_next/static|_next/image|brand|favicon|app-icon).*)",
  ],
};
