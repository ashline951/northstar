import { sql } from "../db";
import type { Group } from "./filter";

/**
 * Saved layouts and saved filters - docs/standards/list-view.md section 15.
 *
 * Keyed on lower(email) like every other per-person table in Northstar. A row
 * with a null user_email is the default for everyone.
 */

export type StoredLayout = {
  columns: string[];
  sort: { column: string; dir: "asc" | "desc" };
  filter: Group;
  groupBy: string | null;
  pageSize: number | null;
};

type LayoutRow = {
  columns: string[];
  sort: StoredLayout["sort"];
  filter: Group;
  group_by: string | null;
  page_size: number | null;
};

function toLayout(r: LayoutRow): StoredLayout {
  return {
    columns: r.columns,
    sort: r.sort,
    filter: r.filter,
    groupBy: r.group_by,
    pageSize: r.page_size,
  };
}

/** The person's own saved view, or null before they have changed anything. */
export async function getMyLayout(
  listId: string,
  email: string
): Promise<StoredLayout | null> {
  const rows = (await sql`
    select columns, sort, filter, group_by, page_size
    from northstar_list_layouts
    where list_id = ${listId} and lower(user_email) = lower(${email})
    limit 1
  `) as LayoutRow[];
  return rows[0] ? toLayout(rows[0]) : null;
}

/** The admin default, which everyone without their own view starts from. */
export async function getDefaultLayout(
  listId: string
): Promise<StoredLayout | null> {
  const rows = (await sql`
    select columns, sort, filter, group_by, page_size
    from northstar_list_layouts
    where list_id = ${listId} and user_email is null
    limit 1
  `) as LayoutRow[];
  return rows[0] ? toLayout(rows[0]) : null;
}

export async function saveLayout(
  listId: string,
  email: string | null,
  layout: StoredLayout,
  actor: string
): Promise<void> {
  // One statement, so two tabs saving at once cannot leave two rows behind.
  await sql`
    insert into northstar_list_layouts
      (list_id, user_email, columns, sort, filter, group_by, page_size, updated_by)
    values (
      ${listId}, ${email},
      ${JSON.stringify(layout.columns)}::jsonb,
      ${JSON.stringify(layout.sort)}::jsonb,
      ${JSON.stringify(layout.filter)}::jsonb,
      ${layout.groupBy}, ${layout.pageSize}, ${actor}
    )
    on conflict (list_id, lower(coalesce(user_email, '')))
    do update set
      columns = excluded.columns,
      sort = excluded.sort,
      filter = excluded.filter,
      group_by = excluded.group_by,
      page_size = excluded.page_size,
      updated_at = now(),
      updated_by = excluded.updated_by
  `;
}

export async function deleteMyLayout(
  listId: string,
  email: string
): Promise<void> {
  await sql`
    delete from northstar_list_layouts
    where list_id = ${listId} and lower(user_email) = lower(${email})
  `;
}

export type SavedFilter = {
  id: number;
  name: string;
  filter: Group;
  owner_email: string;
  shared: boolean;
};

/** Shared first, then by name - section 12. */
export async function listSavedFilters(
  listId: string,
  email: string
): Promise<SavedFilter[]> {
  return (await sql`
    select id, name, filter, owner_email, shared
    from northstar_saved_filters
    where list_id = ${listId}
      and (shared = true or lower(owner_email) = lower(${email}))
    order by shared desc, lower(name)
  `) as SavedFilter[];
}

export async function insertSavedFilter(params: {
  listId: string;
  name: string;
  filter: Group;
  owner: string;
  shared: boolean;
}): Promise<void> {
  await sql`
    insert into northstar_saved_filters (list_id, name, filter, owner_email, shared)
    values (
      ${params.listId}, ${params.name},
      ${JSON.stringify(params.filter)}::jsonb,
      ${params.owner}, ${params.shared}
    )
  `;
}

export async function getSavedFilter(
  id: number
): Promise<SavedFilter | null> {
  const rows = (await sql`
    select id, name, filter, owner_email, shared
    from northstar_saved_filters where id = ${id} limit 1
  `) as SavedFilter[];
  return rows[0] ?? null;
}

export async function deleteSavedFilter(id: number): Promise<void> {
  await sql`delete from northstar_saved_filters where id = ${id}`;
}
