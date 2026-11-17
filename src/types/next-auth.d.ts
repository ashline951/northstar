import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      givenName?: string | null;
      surname?: string | null;
      jobTitle?: string | null;
      department?: string | null;
      role?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    givenName?: string | null;
    surname?: string | null;
    jobTitle?: string | null;
    department?: string | null;
    role?: string | null;
  }
}
