import { sql } from "./db";
import { ROSTER_IMPORT_SQL } from "./roster-import";
import { CORE_TEAM_GRANT_SQL, PMO_IMPORT_SQL } from "./pmo-import";
import { DEMO_RECORDS_SQL } from "./demo-records";
import { ASSISTANT_TEAM_NOTES_SQL } from "./assistant-notes-seed";

/**
 * Schema migrations, applied from the app rather than by hand in the Neon
 * console - so anyone empowered to build on Northstar can ship a schema change
 * without database access.
 *
 * Rules for adding one:
 *  - Append to the end. Never edit or reorder an applied migration.
 *  - One SQL statement per array entry. The Neon HTTP driver rejects multiple
 *    commands in a single call.
 *  - Write every statement so re-running it is harmless (`if not exists`,
 *    `on conflict do nothing`). Belt and braces against a half-applied run.
 *
 * Concurrency: several serverless instances may try at once. The name is
 * inserted first and the insert only returns a row to the instance that won,
 * so exactly one runs the statements.
 */
type Migration = { name: string; statements: string[] };

export const MIGRATIONS: Migration[] = [
  {
    name: "001_users",
    statements: [
      `create table if not exists northstar_users (
         email           text primary key,
         display_name    text,
         role            text not null default 'Member'
                         check (role in ('Member', 'Project Manager')),
         is_active       boolean not null default true,
         welcome_seen_at timestamptz,
         invited_by      text,
         created_at      timestamptz not null default now()
       )`,
      `create unique index if not exists northstar_users_email_lower
         on northstar_users (lower(email))`,
    ],
  },
  {
    name: "003_assistant_notes",
    statements: [
      `create table if not exists northstar_assistant_notes (
         id         serial primary key,
         body       text not null,
         is_active  boolean not null default true,
         added_by   text,
         created_at timestamptz not null default now()
       )`,
    ],
  },
  {
    name: "004_project",
    statements: [
      `alter table northstar_users
         add column if not exists has_project_access boolean not null default false`,
      `create table if not exists northstar_tmp_project_items (
         id          serial primary key,
         title       text not null,
         status      text not null default 'Not started'
                     check (status in ('Not started', 'In progress', 'Blocked', 'Done')),
         owner_email text,
         notes       text,
         due_on      date,
         created_by  text,
         created_at  timestamptz not null default now(),
         updated_at  timestamptz not null default now()
       )`,
      `create table if not exists northstar_tmp_project_links (
         id         serial primary key,
         label      text not null,
         url        text not null,
         added_by   text,
         created_at timestamptz not null default now()
       )`,
    ],
  },
  {
    name: "005_roster_import",
    statements: [ROSTER_IMPORT_SQL],
  },
  {
    name: "006_pmo_and_core_team",
    statements: [PMO_IMPORT_SQL, CORE_TEAM_GRANT_SQL],
  },
  {
    name: "007_assistant_team_notes",
    statements: [ASSISTANT_TEAM_NOTES_SQL],
  },
  {
    name: "008_oauth",
    statements: [
      `create table if not exists northstar_oauth_clients (
         client_id     text primary key,
         client_name   text,
         redirect_uris text[] not null,
         created_at    timestamptz not null default now()
       )`,
      `create table if not exists northstar_oauth_codes (
         code_hash      text primary key,
         client_id      text not null,
         user_email     text not null,
         redirect_uri   text not null,
         code_challenge text not null,
         scope          text,
         used           boolean not null default false,
         expires_at     timestamptz not null,
         created_at     timestamptz not null default now()
       )`,
      `create table if not exists northstar_oauth_tokens (
         token_hash text primary key,
         kind       text not null check (kind in ('access', 'refresh')),
         client_id  text not null,
         user_email text not null,
         scope      text,
         revoked    boolean not null default false,
         expires_at timestamptz not null,
         created_at timestamptz not null default now()
       )`,
      `create index if not exists northstar_oauth_tokens_user
         on northstar_oauth_tokens (user_email)`,
    ],
  },
  {
    name: "009_records",
    statements: [
      `create sequence if not exists northstar_record_seq start 1`,
      // The lifecycle/state pairing is enforced here, not only in the UI.
      // A state belongs to exactly one lifecycle, so the two columns cannot
      // drift into a combination nobody designed.
      `create table if not exists northstar_records (
         id             bigserial primary key,
         suffix         text not null unique,
         lifecycle      text not null check (lifecycle in ('Idea', 'Demand', 'Project')),
         state          text not null,
         title          text not null,
         description    text,
         assigned_to    text,
         assigned_group text,
         created_by     text,
         created_at     timestamptz not null default now(),
         updated_at     timestamptz not null default now(),
         constraint northstar_records_state_matches_lifecycle check (
           (lifecycle = 'Idea'
             and state in ('Draft', 'Submitted', 'Accepted', 'Idea Closed'))
           or (lifecycle = 'Demand'
             and state in ('Draft', 'Submitted', 'Screening', 'Qualified',
                           'Approved', 'Deferred', 'DMND Closed'))
           or (lifecycle = 'Project'
             and state in ('Initiate', 'Plan', 'Execute', 'Monitor/Control',
                           'Prj Closed'))
         )
       )`,
      `create table if not exists northstar_record_history (
         id             bigserial primary key,
         record_id      bigint not null references northstar_records(id) on delete cascade,
         from_lifecycle text,
         to_lifecycle   text not null,
         changed_by     text,
         changed_at     timestamptz not null default now()
       )`,
      `create index if not exists northstar_record_history_record
         on northstar_record_history (record_id)`,
    ],
  },
  {
    name: "010_record_active_flag",
    statements: [
      `alter table northstar_records
         add column if not exists is_active boolean not null default true`,
      `create index if not exists northstar_records_lifecycle_active
         on northstar_records (lifecycle, is_active)`,
    ],
  },
  {
    name: "011_nav_favorites_history",
    statements: [
      // Favourites are per person and live on the server, not the browser, so
      // they follow someone between computers.
      `create table if not exists northstar_nav_favorites (
         id         bigserial primary key,
         user_email text not null,
         label      text not null,
         href       text not null,
         position   integer not null default 0,
         created_at timestamptz not null default now()
       )`,
      `create index if not exists northstar_nav_favorites_user
         on northstar_nav_favorites (lower(user_email), position)`,
      // One row per page per person: revisiting updates the timestamp rather
      // than filling the list with the same page.
      `create table if not exists northstar_nav_history (
         id         bigserial primary key,
         user_email text not null,
         label      text not null,
         href       text not null,
         visited_at timestamptz not null default now()
       )`,
      `create unique index if not exists northstar_nav_history_user_href
         on northstar_nav_history (lower(user_email), href)`,
      `create index if not exists northstar_nav_history_recent
         on northstar_nav_history (lower(user_email), visited_at desc)`,
    ],
  },
  {
    // Standard v1.2: History keeps one entry per PAGE (path), remembering the
    // latest address, so filtering a list does not fill History with copies.
    // Nothing wrote to this table before this migration, but each step is
    // still safe to re-run and safe on existing rows.
    name: "012_nav_history_per_page",
    statements: [
      `alter table northstar_nav_history add column if not exists path text`,
      `update northstar_nav_history set path = split_part(href, '?', 1) where path is null`,
      `delete from northstar_nav_history h
         using northstar_nav_history newer
         where lower(h.user_email) = lower(newer.user_email)
           and h.path = newer.path
           and (h.visited_at < newer.visited_at
                or (h.visited_at = newer.visited_at and h.id < newer.id))`,
      `drop index if exists northstar_nav_history_user_href`,
      `create unique index if not exists northstar_nav_history_user_path
         on northstar_nav_history (lower(user_email), path)`,
      `alter table northstar_nav_history alter column path set not null`,
    ],
  },
  {
    name: "013_demo_records",
    statements: [DEMO_RECORDS_SQL],
  },
  {
    // The list view standard's two tables (section 15). Keyed on lower(email)
    // like the rest of Northstar, rather than a user id, because that is how
    // every other per-person table here is keyed.
    name: "014_list_layouts_and_saved_filters",
    statements: [
      `create table if not exists northstar_list_layouts (
         id         bigserial primary key,
         list_id    text not null,
         user_email text,
         columns    jsonb not null,
         sort       jsonb not null,
         filter     jsonb not null,
         group_by   text,
         page_size  integer,
         updated_at timestamptz not null default now(),
         updated_by text
       )`,
      // null user_email is the default for everyone, and "nulls not distinct"
      // is what stops two of them existing.
      `create unique index if not exists northstar_list_layouts_one_per_person
         on northstar_list_layouts (list_id, lower(coalesce(user_email, '')))`,
      `create table if not exists northstar_saved_filters (
         id          bigserial primary key,
         list_id     text not null,
         name        text not null,
         filter      jsonb not null,
         owner_email text not null,
         shared      boolean not null default false,
         created_at  timestamptz not null default now()
       )`,
      // Names are unique ignoring capitals: per owner, and among shared ones.
      `create unique index if not exists northstar_saved_filters_own_name
         on northstar_saved_filters (list_id, lower(owner_email), lower(name))
         where shared = false`,
      `create unique index if not exists northstar_saved_filters_shared_name
         on northstar_saved_filters (list_id, lower(name))
         where shared = true`,
    ],
  },
];

export type MigrationState = { name: string; applied_at: string | null };

async function ensureTable(): Promise<void> {
  await sql`
    create table if not exists northstar_migrations (
      name       text primary key,
      applied_at timestamptz not null default now()
    )
  `;
}

export async function migrationState(): Promise<MigrationState[]> {
  await ensureTable();
  const rows = (await sql`
    select name, applied_at from northstar_migrations
  `) as { name: string; applied_at: string }[];
  const applied = new Map(rows.map((r) => [r.name, r.applied_at]));
  return MIGRATIONS.map((m) => ({
    name: m.name,
    applied_at: applied.get(m.name) ?? null,
  }));
}

/** Applies anything outstanding. Returns the names it ran. */
export async function runPendingMigrations(): Promise<string[]> {
  await ensureTable();
  const ran: string[] = [];

  for (const m of MIGRATIONS) {
    // Claim it first: only the instance whose insert returns a row proceeds.
    const claimed = (await sql`
      insert into northstar_migrations (name) values (${m.name})
      on conflict (name) do nothing
      returning name
    `) as { name: string }[];
    if (claimed.length === 0) continue;

    try {
      for (const stmt of m.statements) await sql.query(stmt);
      ran.push(m.name);
    } catch (err) {
      // Release the claim so a retry can pick it up rather than it looking
      // applied when it is not.
      await sql`delete from northstar_migrations where name = ${m.name}`;
      throw new Error(
        `Migration ${m.name} failed: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return ran;
}

/**
 * Applies pending migrations automatically, once per serverless instance.
 *
 * Nobody should have to click a button or open a SQL console to get a schema
 * change live: pushing code is the whole deployment step. The first database
 * read after a deploy triggers this; later calls await the same settled
 * promise, so the cost is one extra query per cold start.
 *
 * Failures are logged and swallowed deliberately. A broken migration must not
 * lock everyone out of the app - the access check fails closed on its own, and
 * /admin still shows what is outstanding with a button to retry.
 */
let migrationRun: Promise<void> | null = null;

export function ensureMigrated(): Promise<void> {
  if (!migrationRun) {
    migrationRun = runPendingMigrations()
      .then((ran) => {
        if (ran.length) console.log("northstar: applied migrations", ran);
      })
      .catch((err) => {
        console.error("northstar: migrations failed", err);
        // Allow a later request to retry rather than staying broken for the
        // life of this instance.
        migrationRun = null;
      });
  }
  return migrationRun;
}
