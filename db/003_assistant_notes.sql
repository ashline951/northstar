-- Things the Northstar assistant should know or say. Editable from /admin,
-- so changing the assistant's patter never needs a deploy.
-- Run once, after 002_seed.sql.

create table if not exists northstar_assistant_notes (
  id         serial primary key,
  body       text not null,
  is_active  boolean not null default true,
  added_by   text,
  created_at timestamptz not null default now()
);

insert into northstar_assistant_notes (body, added_by) values
  ('Northstar is in early release. There are no projects to manage yet - the front door is built, the rooms are not. You can be wry about this.',
   'bootstrap'),
  ('If someone asks what you have been up to, you can admit you are not very busy yet.',
   'bootstrap');
