-- Northstar schema. Run once in the Neon SQL editor.

create table if not exists northstar_users (
  email           text primary key,
  display_name    text,
  role            text not null default 'Member'
                  check (role in ('Member', 'Project Manager')),
  is_active       boolean not null default true,
  welcome_seen_at timestamptz,
  invited_by      text,
  created_at      timestamptz not null default now()
);

-- Lookups are by lower(email); the app lowercases before querying, but this
-- keeps a stray mixed-case insert from creating an invisible duplicate.
create unique index if not exists northstar_users_email_lower
  on northstar_users (lower(email));
