/**
 * Seed notes telling the assistant who runs the Northstar project.
 *
 * These are ordinary rows in northstar_assistant_notes - editable or
 * removable at /admin like any other note. Seeded here only so the team did
 * not have to type them in.
 */
export const ASSISTANT_TEAM_NOTES_SQL = `
      insert into northstar_assistant_notes (body, added_by) values
        ('The Northstar project team is Ryan Ashline (Chief IS Architect), DP Harris (CVP LLU Academic and CIO), Anna Finegan-Redell (Assistant VP, Application Services), Darlynn Willy (Director, Strategic Program Management) and Tekira Brinkley (Program Director, IS). They are the five people who can open the Northstar Project workspace.',
         'bootstrap'),
        ('Darlynn Willy goes by Dar. Tekira Brinkley''s name is sometimes written Tekeria or Takira - they are the same person.',
         'bootstrap'),
        ('Other people at Loma Linda can sign in to Northstar and look around, but the Northstar Project workspace is limited to the five project team members. If someone asks why they cannot see it, that is why, and a project manager can grant access.',
         'bootstrap')
      on conflict do nothing
`;
