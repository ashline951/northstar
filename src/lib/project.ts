import { sql } from "./db";

/**
 * The Northstar project workspace - a stop-gap for running the Northstar
 * project itself until real project management exists. Backed by the
 * northstar_tmp_* tables; see db/004_project.sql.
 */

export const STATUSES = [
  "Not started",
  "In progress",
  "Blocked",
  "Done",
] as const;

export type ProjectItem = {
  id: number;
  title: string;
  status: string;
  owner_email: string | null;
  notes: string | null;
  due_on: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectLink = {
  id: number;
  label: string;
  url: string;
  added_by: string | null;
  created_at: string;
};

export async function listItems(): Promise<ProjectItem[]> {
  return (await sql`
    select * from northstar_tmp_project_items
    order by
      case status
        when 'Blocked' then 0
        when 'In progress' then 1
        when 'Not started' then 2
        else 3
      end,
      due_on nulls last,
      id
  `) as ProjectItem[];
}

export async function addItem(
  title: string,
  ownerEmail: string | null,
  dueOn: string | null,
  createdBy: string
): Promise<void> {
  await sql`
    insert into northstar_tmp_project_items (title, owner_email, due_on, created_by)
    values (${title}, ${ownerEmail}, ${dueOn}, ${createdBy})
  `;
}

export async function setItemStatus(id: number, status: string): Promise<void> {
  await sql`
    update northstar_tmp_project_items
    set status = ${status}, updated_at = now()
    where id = ${id}
  `;
}

export async function setItemNotes(id: number, notes: string): Promise<void> {
  await sql`
    update northstar_tmp_project_items
    set notes = ${notes}, updated_at = now()
    where id = ${id}
  `;
}

export async function deleteItem(id: number): Promise<void> {
  await sql`delete from northstar_tmp_project_items where id = ${id}`;
}

export async function listLinks(): Promise<ProjectLink[]> {
  return (await sql`
    select * from northstar_tmp_project_links order by id
  `) as ProjectLink[];
}

export async function addLink(
  label: string,
  url: string,
  addedBy: string
): Promise<void> {
  await sql`
    insert into northstar_tmp_project_links (label, url, added_by)
    values (${label}, ${url}, ${addedBy})
  `;
}

export async function deleteLink(id: number): Promise<void> {
  await sql`delete from northstar_tmp_project_links where id = ${id}`;
}
