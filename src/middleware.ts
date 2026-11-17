export { auth as middleware } from "@/auth";

export const config = {
  // Protect everything except Next internals, static files, and the auth routes
  // themselves. Adjust as Northstar's route map firms up.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
