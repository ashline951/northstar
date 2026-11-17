-- Initial Northstar roster. Run once, after 001_init.sql.
-- Adjust before running if the list has changed.

insert into northstar_users (email, display_name, role, invited_by) values
  ('rashline@llu.edu', 'Ashline, Ryan',       'Project Manager', 'bootstrap'),
  ('cedar@llu.edu',    'Edar, Carina',        'Member',          'bootstrap'),
  ('rtyo@llu.edu',     'Tyo, Robert',         'Member',          'bootstrap'),
  ('dpharris@llu.edu', 'Harris, DP',          'Member',          'bootstrap'),
  ('BWalls@llu.edu',   'Walls, Brett',        'Member',          'bootstrap'),
  ('esantos@llu.edu',  'Santos, Ed',          'Member',          'bootstrap'),
  ('cwthomas@llu.edu', 'Thomas, Christopher', 'Member',          'bootstrap'),
  ('jwical@llu.edu',   'Wical, John',         'Member',          'bootstrap'),
  ('CACianci@llu.edu', 'Cianci, Carissa',     'Member',          'bootstrap')
on conflict (email) do nothing;
