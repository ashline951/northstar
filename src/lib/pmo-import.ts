/**
 * IS Project Management Office roster (25 people) plus the two managers it
 * references, Darlynn Willy and Anna Finegan-Redell, resolved from the
 * Microsoft 365 directory.
 *
 * Everyone lands as a Member with NO project access: they can sign in and use
 * Northstar, but the Northstar Project workspace stays hidden from them.
 *
 * Generated, not hand-written. Add anyone else through /admin.
 */
export const PMO_IMPORT_SQL = `
      insert into northstar_users (email, display_name, role, invited_by) values
        ('SBabineauruffley@llu.edu', 'Babineau-Ruffley, Stephanie', 'Member', 'PMO import'),
        ('tbitzer@llu.edu', 'Bitzer, Trudi', 'Member', 'PMO import'),
        ('TBrinkley@llu.edu', 'Brinkley, Tekira', 'Member', 'PMO import'),
        ('GEODiaz@llu.edu', 'Diaz, George', 'Member', 'PMO import'),
        ('eellis@llu.edu', 'Ellis, Elise', 'Member', 'PMO import'),
        ('MarissaForte@llu.edu', 'Forte, Marissa', 'Member', 'PMO import'),
        ('ffowles@llu.edu', 'Fowles, Frank', 'Member', 'PMO import'),
        ('DAGresham@llu.edu', 'Gresham, Daneitra', 'Member', 'PMO import'),
        ('RAHarr@llu.edu', 'Harr, Ruth Ann', 'Member', 'PMO import'),
        ('AMIJones@llu.edu', 'Jones, Amina', 'Member', 'PMO import'),
        ('JKoelliker@llu.edu', 'Koelliker, Jason', 'Member', 'PMO import'),
        ('BLaurent@llu.edu', 'Laurent, Bithja', 'Member', 'PMO import'),
        ('slong@llu.edu', 'Long, Sheri', 'Member', 'PMO import'),
        ('MKLopez@llu.edu', 'Lopez, Michael K.', 'Member', 'PMO import'),
        ('VJMontoya@llu.edu', 'Montoya, Valerie', 'Member', 'PMO import'),
        ('DMosch@llu.edu', 'Mosch, Darin', 'Member', 'PMO import'),
        ('GOngsioco@llu.edu', 'Ongsioco, Geri', 'Member', 'PMO import'),
        ('KRios@llu.edu', 'Rios, Kristine', 'Member', 'PMO import'),
        ('SCRobinson@llu.edu', 'Robinson, Sharon', 'Member', 'PMO import'),
        ('MSalleza@llu.edu', 'Salleza, Kara', 'Member', 'PMO import'),
        ('DSeverson@llu.edu', 'Severson, Dawn', 'Member', 'PMO import'),
        ('JStacey@llu.edu', 'Stacey, Jennelle', 'Member', 'PMO import'),
        ('rtinnelly@llu.edu', 'Tinnelly, Rich', 'Member', 'PMO import'),
        ('CriscianeTran@llu.edu', 'Tran, Cristian', 'Member', 'PMO import'),
        ('PWalther@llu.edu', 'Walther, Priscilla', 'Member', 'PMO import'),
        ('DWilly@llu.edu', 'Willy, Darlynn', 'Member', 'PMO import'),
        ('AFineganredell@llu.edu', 'Finegan-Redell, Anna', 'Member', 'PMO import')
      on conflict (email) do nothing
`;

/**
 * The Northstar project core team: Ryan, DP Harris, Tekira Brinkley,
 * Darlynn Willy and Anna Finegan-Redell. Everyone else is a Member without
 * project access, and is granted it per person at /admin.
 */
export const CORE_TEAM_GRANT_SQL = `
      update northstar_users set has_project_access = true
      where lower(email) in ('rashline@llu.edu', 'dpharris@llu.edu', 'tbrinkley@llu.edu', 'dwilly@llu.edu', 'afineganredell@llu.edu')
`;
