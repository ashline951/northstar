import { sql } from "./db";

export type AssistantNote = {
  id: number;
  body: string;
  is_active: boolean;
  added_by: string | null;
  created_at: string;
};

/**
 * Notes are injected into the assistant's system prompt. They shape what it
 * knows and how it jokes - NOT what it is allowed to do. The safety section of
 * the prompt is appended after these and says so explicitly, so a note cannot
 * talk the assistant out of refusing clinical content.
 */
export async function activeNotes(): Promise<string[]> {
  try {
    const rows = (await sql`
      select body from northstar_assistant_notes
      where is_active = true order by id
    `) as { body: string }[];
    return rows.map((r) => r.body);
  } catch (err) {
    // A missing table or an outage should quiet the assistant's patter, not
    // break the chat.
    console.error("northstar: could not read assistant notes", err);
    return [];
  }
}

export async function listNotes(): Promise<AssistantNote[]> {
  return (await sql`
    select * from northstar_assistant_notes order by is_active desc, id
  `) as AssistantNote[];
}

export async function addNote(body: string, addedBy: string): Promise<void> {
  await sql`
    insert into northstar_assistant_notes (body, added_by)
    values (${body.trim()}, ${addedBy})
  `;
}

export async function deleteNote(id: number): Promise<void> {
  await sql`delete from northstar_assistant_notes where id = ${id}`;
}
