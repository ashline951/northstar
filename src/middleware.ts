export { auth as middleware } from "@/auth";

export const config = {
  // Everything requires sign-in except Next internals, the auth routes, the
  // signed-out page, and static brand assets.
  matcher: [
    "/((?!api/auth|signed-out|not-authorized|_next/static|_next/image|brand|favicon|app-icon).*)",
  ],
};
