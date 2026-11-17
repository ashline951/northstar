import NextAuth from "next-auth";
import authConfig from "@/auth.config";

// Deliberately built from the edge-safe config: middleware only needs to
// verify the session cookie, and must not pull the database driver in.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Everything requires sign-in except Next internals, the auth routes, the
  // public signed-out / not-authorized pages, and static brand assets.
  matcher: [
    "/((?!api/auth|signin|signed-out|not-authorized|_next/static|_next/image|brand|favicon|app-icon).*)",
  ],
};
