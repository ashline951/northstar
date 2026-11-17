-- Northstar's own project workspace: a stop-gap used to run the Northstar
-- project while the real project management system is built.
--
-- The tmp_ prefix is deliberate. These tables are NOT the eventual data model.
-- When real project management ships, migrate what is worth keeping and drop
-- the rest. Do not build anything else on top of them.
--
-- Run once, after 003_assistant_notes.sql.

-- Who can see the Project link and page. Separate from `role`, because this
-- is a different question from who administers access.
alter table northstar_users
  add column if not exists has_project_access boolean not null default false;

create table if not exists northstar_tmp_project_items (
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
);

create table if not exists northstar_tmp_project_links (
  id         serial primary key,
  label      text not null,
  url        text not null,
  added_by   text,
  created_at timestamptz not null default now()
);

-- Ryan starts with access; grant the rest from /admin.
update northstar_users set has_project_access = true
  where lower(email) = 'rashline@llu.edu';
