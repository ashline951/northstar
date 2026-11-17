/**
 * Northstar access control and in-app roles.
 *
 * Entra authenticates anyone in the LLUH tenant. Northstar decides who is
 * actually allowed in, from two environment variables:
 *
 *   NORTHSTAR_ALLOWED_USERS      = "a@llu.edu,b@llu.edu"
 *   NORTHSTAR_PROJECT_MANAGERS   = "a@llu.edu"
 *
 * Project managers are implicitly allowed, so nobody has to be listed twice.
 *
 * FAILS CLOSED: if both variables are empty or missing, nobody gets in. An
 * authorization control that defaults to open is worse than one that locks
 * out its own owner, so an unconfigured deployment admits no one.
 *
 * Kept in environment variables rather than the repo so real staff addresses
 * stay out of git.
 */
export const ROLE_PROJECT_MANAGER = "Project Manager";
export const ROLE_MEMBER = "Member";

function parse(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function projectManagers(): string[] {
  return parse(process.env.NORTHSTAR_PROJECT_MANAGERS);
}

/** Everyone permitted to sign in: the allow list plus the project managers. */
function allowed(): string[] {
  return [...parse(process.env.NORTHSTAR_ALLOWED_USERS), ...projectManagers()];
}

export function isAllowed(email?: string | null): boolean {
  if (!email) return false;
  return allowed().includes(email.toLowerCase());
}

export function roleForEmail(email?: string | null): string {
  if (!email) return ROLE_MEMBER;
  return projectManagers().includes(email.toLowerCase())
    ? ROLE_PROJECT_MANAGER
    : ROLE_MEMBER;
}
