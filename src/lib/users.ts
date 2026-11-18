import { sql } from "./db";
import { ensureMigrated } from "./migrations";

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
export type Lookup =
  /** On the roster and active. */
  | { status: "ok"; user: NorthstarUser }
  /** Reached the database; this person is not on the roster. */
  | { status: "denied" }
  /** Could not reach the database. Access is still refused, but this is an
   *  outage, not a decision - and pages should say so rather than telling
   *  someone they lack a role they actually hold. */
  | { status: "unavailable" };

export async function lookupUser(email?: string | null): Promise<Lookup> {
  if (!email) return { status: "denied" };
  // Every authenticated path passes through here, so this is where a deploy's
  // schema changes get applied - no button, no SQL console.
  await ensureMigrated();
  try {
    const rows = (await sql`
      select * from northstar_users
      where lower(email) = ${email.toLowerCase()} and is_active = true
      limit 1
    `) as NorthstarUser[];
    return rows[0] ? { status: "ok", user: rows[0] } : { status: "denied" };
  } catch (err) {
    console.error("northstar: access check failed, denying", err);
    return { status: "unavailable" };
  }
}

/**
 * Fails closed: both "not on the roster" and "cannot reach the database"
 * return null. Use this wherever the only question is whether to allow
 * something; use lookupUser when the answer is shown to a person.
 */
export async function getActiveUser(
  email?: string | null
): Promise<NorthstarUser | null> {
  const result = await lookupUser(email);
  return result.status === "ok" ? result.user : null;
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
  // Sorted by surname. Display names are stored "Last, First", so ordering on
  // display_name is already a surname sort; split on the comma so a name
  // stored "First Last" still files under the last word rather than the first.
  // Removed people sink to the bottom. Anyone without a name falls back to
  // their email.
  return (await sql`
    select * from northstar_users
    order by
      is_active desc,
      lower(
        case
          when display_name is null or display_name = '' then email
          when position(',' in display_name) > 0
            then split_part(display_name, ',', 1)
          else reverse(split_part(reverse(display_name), ' ', 1))
        end
      ),
      lower(coalesce(display_name, email))
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

/** Clears someone's welcome-video record so they see the first-run
 *  experience again. Useful before a demo, and the only way to re-test the
 *  gate as a new person sees it. */
export async function resetWelcome(email: string): Promise<void> {
  await sql`
    update northstar_users set welcome_seen_at = null
    where lower(email) = ${email.toLowerCase()}
  `;
}
