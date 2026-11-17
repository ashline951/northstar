/**
 * Roster import - the BPM and LLU exports Ryan supplied, merged and
 * de-duplicated by lower(email): 15 people. The "all" (280) and
 * "application team" (124) exports are deliberately NOT included.
 *
 * Everyone lands as a Member with no project access. Being here means they can
 * sign in; it does not put them on the Northstar project, which is granted
 * per person at /admin.
 *
 * Generated, not hand-written. Add anyone else through /admin.
 */
export const ROSTER_IMPORT_SQL = `
      insert into northstar_users (email, display_name, role, invited_by) values
        ('RAshline@llu.edu', 'Ashline, Ryan', 'Member', 'roster import'),
        ('HChowhan@llu.edu', 'Chowhan, Harris', 'Member', 'roster import'),
        ('CACianci@llu.edu', 'Cianci, Carissa', 'Member', 'roster import'),
        ('cedar@llu.edu', 'Edar, Carina', 'Member', 'roster import'),
        ('jmgrove@llu.edu', 'Grove, Jeremy', 'Member', 'roster import'),
        ('dpharris@llu.edu', 'Harris, DP', 'Member', 'roster import'),
        ('MHernand@llu.edu', 'Hernandez, Matt', 'Member', 'roster import'),
        ('EHossain@llu.edu', 'Hossain, Ekhtear', 'Member', 'roster import'),
        ('bodenusi@llu.edu', 'Odenusi, Boye', 'Member', 'roster import'),
        ('esantos@llu.edu', 'Santos, Ed', 'Member', 'roster import'),
        ('cwthomas@llu.edu', 'Thomas, Christopher', 'Member', 'roster import'),
        ('rtyo@llu.edu', 'Tyo, Robert', 'Member', 'roster import'),
        ('BWalls@llu.edu', 'Walls, Brett', 'Member', 'roster import'),
        ('jwical@llu.edu', 'Wical, John', 'Member', 'roster import'),
        ('dionnewilliams@llu.edu', 'Williams, Dionne', 'Member', 'roster import')
      on conflict (email) do nothing
`;
