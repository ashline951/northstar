/**
 * Northstar in-app roles.
 *
 * The roster is read from the NORTHSTAR_PROJECT_MANAGERS environment variable
 * (comma-separated email addresses) rather than committed here, so real staff
 * names and addresses stay out of the repository.
 *
 *   NORTHSTAR_PROJECT_MANAGERS="a@llu.edu,b@llu.edu"
 *
 * Adding someone today means updating that variable and redeploying. Moving to
 * self-service invitations needs a database - deliberately deferred.
 */
export const ROLE_PROJECT_MANAGER = "Project Manager";
export const ROLE_MEMBER = "Member";

function roster(): string[] {
  return (process.env.NORTHSTAR_PROJECT_MANAGERS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function roleForEmail(email?: string | null): string {
  if (!email) return ROLE_MEMBER;
  return roster().includes(email.toLowerCase())
    ? ROLE_PROJECT_MANAGER
    : ROLE_MEMBER;
}
