import { sql } from "./db";

export const ROLE_PROJECT_MANAGER = "Project Manager";
export const ROLE_MEMBER = "Member";

export type NorthstarUser = {
  email: string;
  display_name: string | null;
  role: string;
  is_active: boolean;
  welcome_seen_at: string | null;
  has_project_access: boolean;
  invited_by: string | null;
  created_at: string;
};

/**
 * The access check. Returns the row only for people who are on the roster AND
 * active.
 *
 * FAILS CLOSED. If the database is unreachable this returns null, so an
 * outage denies access rather than granting it. That is the right failure for
 * an authorisation control, even though it means a database problem looks
 * like a login problem.
 */
export async function getActiveUser(
  email?: string | null
): Promise<NorthstarUser | null> {
  if (!email) return null;
  try {
    const rows = (await sql`
      select * from northstar_users
      where lower(email) = ${email.toLowerCase()} and is_active = true
      limit 1
    `) as NorthstarUser[];
    return rows[0] ?? null;
  } catch (err) {
    console.error("northstar: access check failed, denying", err);
    return null;
  }
}

export async function hasSeenWelcome(email?: string | null): Promise<boolean> {
  const user = await getActiveUser(email);
  return Boolean(user?.welcome_seen_at);
}

export async function markWelcomeSeen(email?: string | null): Promise<void> {
  if (!email) return;
  try {
    await sql`
      update northstar_users set welcome_seen_at = now()
      where lower(email) = ${email.toLowerCase()} and welcome_seen_at is null
    `;
  } catch (err) {
    // Not worth failing the page over - they would just see it again.
    console.error("northstar: could not record welcome view", err);
  }
}

export async function listUsers(): Promise<NorthstarUser[]> {
  return (await sql`
    select * from northstar_users order by is_active desc, lower(email)
  `) as NorthstarUser[];
}

export async function addUser(
  email: string,
  displayName: string | null,
  role: string,
  invitedBy: string
): Promise<void> {
  await sql`
    insert into northstar_users (email, display_name, role, invited_by)
    values (${email.trim()}, ${displayName}, ${role}, ${invitedBy})
    on conflict (email) do update
      set is_active = true, role = ${role}, display_name = ${displayName}
  `;
}

/** Soft delete: keeps the audit trail of who was once granted access. */
export async function deactivateUser(email: string): Promise<void> {
  await sql`
    update northstar_users set is_active = false
    where lower(email) = ${email.toLowerCase()}
  `;
}

export async function setRole(email: string, role: string): Promise<void> {
  await sql`
    update northstar_users set role = ${role}
    where lower(email) = ${email.toLowerCase()}
  `;
}

export async function setProjectAccess(
  email: string,
  allowed: boolean
): Promise<void> {
  await sql`
    update northstar_users set has_project_access = ${allowed}
    where lower(email) = ${email.toLowerCase()}
  `;
}
