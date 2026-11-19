"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getActiveUser, ROLE_PROJECT_MANAGER } from "@/lib/users";
import { RECORDS_LIST } from "@/lib/list-view/registry";
import {
  isEmptyFilter,
  parseFilter,
  type Group,
} from "@/lib/list-view/filter";
import type { SortDir } from "@/lib/list-view/types";
import { PER_PAGE_OPTIONS } from "@/lib/list-view/types";
import {
  deleteMyLayout,
  deleteSavedFilter,
  getDefaultLayout,
  getMyLayout,
  getSavedFilter,
  insertSavedFilter,
  listSavedFilters,
  saveLayout,
  type StoredLayout,
} from "@/lib/list-view/store";

/**
 * The list view's server actions - docs/standards/list-view.md section 15.
 *
 * Every one checks sign-in and the list's permission first, and re-validates
 * what it was given against the registry. A server action is a public
 * endpoint; the browser's copy of a filter is not evidence of anything.
 *
 * Results are { ok: true } | { ok: false, error } with the wording from
 * section 7, so the page can say what happened in plain words.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const NO_ACCESS = "You don't have access to this list.";
const NOT_ADMIN = "Only admins can set the default for everyone.";

async function requireAccess(): Promise<
  { ok: true; email: string; admin: boolean } | { ok: false; error: string }
> {
  const session = await auth();
  const user = await getActiveUser(session?.user?.email);
  if (!user?.has_project_access) return { ok: false, error: NO_ACCESS };
  return {
    ok: true,
    email: user.email,
    admin: user.role === ROLE_PROJECT_MANAGER,
  };
}

/** Keeps only column keys the registry knows, in the order given. */
function cleanColumns(keys: unknown): string[] {
  const known = new Set(RECORDS_LIST.columns.map((c) => c.key));
  const out = Array.isArray(keys)
    ? keys.filter((k): k is string => typeof k === "string" && known.has(k))
    : [];
  // None left means the default columns, not a list with no columns at all.
  return out.length ? [...new Set(out)] : RECORDS_LIST.columns.map((c) => c.key);
}

function cleanSort(input: unknown): StoredLayout["sort"] {
  const s = input as Partial<StoredLayout["sort"]>;
  const known = RECORDS_LIST.columns.some((c) => c.key === s?.column);
  return {
    column: known ? (s!.column as string) : RECORDS_LIST.defaultSort.key,
    dir: (s?.dir === "asc" || s?.dir === "desc"
      ? s.dir
      : RECORDS_LIST.defaultSort.dir) as SortDir,
  };
}

function cleanGroupBy(input: unknown): string | null {
  const key = typeof input === "string" ? input : "";
  return RECORDS_LIST.columns.some((c) => c.key === key && c.type !== "date")
    ? key
    : null;
}

function cleanPageSize(input: unknown): number | null {
  const n = Number(input);
  return (PER_PAGE_OPTIONS as readonly number[]).includes(n) ? n : null;
}

/** The layout a person actually gets: theirs, else the admin default. */
export async function effectiveLayout(
  email: string
): Promise<StoredLayout | null> {
  return (await getMyLayout(RECORDS_LIST.id, email)) ?? getDefaultLayout(RECORDS_LIST.id);
}

/**
 * Saves the person's view on every change (section 12: no Save button). The
 * first change copies the whole effective layout, so a later admin default
 * does not silently move their list under them.
 */
export async function saveMyViewAction(input: {
  filter?: unknown;
  sort?: unknown;
  groupBy?: unknown;
  pageSize?: unknown;
}): Promise<ActionResult> {
  const who = await requireAccess();
  if (!who.ok) return who;

  const base =
    (await effectiveLayout(who.email)) ??
    ({
      columns: RECORDS_LIST.columns.map((c) => c.key),
      sort: { column: RECORDS_LIST.defaultSort.key, dir: RECORDS_LIST.defaultSort.dir },
      filter: { kind: "group", match: "all", items: [] } as Group,
      groupBy: null,
      pageSize: null,
    } satisfies StoredLayout);

  const next: StoredLayout = {
    columns: base.columns,
    sort: "sort" in input ? cleanSort(input.sort) : base.sort,
    filter:
      "filter" in input ? parseFilter(RECORDS_LIST, input.filter) : base.filter,
    groupBy: "groupBy" in input ? cleanGroupBy(input.groupBy) : base.groupBy,
    pageSize: "pageSize" in input ? cleanPageSize(input.pageSize) : base.pageSize,
  };

  await saveLayout(RECORDS_LIST.id, who.email, next, who.email);
  return { ok: true };
}

export async function saveMyColumnsAction(
  columns: unknown
): Promise<ActionResult> {
  const who = await requireAccess();
  if (!who.ok) return who;

  const base = await effectiveLayout(who.email);
  await saveLayout(
    RECORDS_LIST.id,
    who.email,
    {
      columns: cleanColumns(columns),
      sort: base?.sort ?? {
        column: RECORDS_LIST.defaultSort.key,
        dir: RECORDS_LIST.defaultSort.dir,
      },
      filter: base?.filter ?? { kind: "group", match: "all", items: [] },
      groupBy: base?.groupBy ?? null,
      pageSize: base?.pageSize ?? null,
    },
    who.email
  );
  revalidatePath("/records", "layout");
  return { ok: true };
}

/** Deletes the person's saved view, so they fall back to the admin default. */
export async function resetMyLayoutAction(): Promise<ActionResult> {
  const who = await requireAccess();
  if (!who.ok) return who;
  await deleteMyLayout(RECORDS_LIST.id, who.email);
  revalidatePath("/records", "layout");
  return { ok: true };
}

export async function setDefaultLayoutAction(input: {
  columns: unknown;
  sort: unknown;
  filter: unknown;
  groupBy: unknown;
}): Promise<ActionResult> {
  const who = await requireAccess();
  if (!who.ok) return who;
  if (!who.admin) return { ok: false, error: NOT_ADMIN };

  await saveLayout(
    RECORDS_LIST.id,
    null,
    {
      columns: cleanColumns(input.columns),
      sort: cleanSort(input.sort),
      filter: parseFilter(RECORDS_LIST, input.filter),
      groupBy: cleanGroupBy(input.groupBy),
      pageSize: null,
    },
    who.email
  );
  revalidatePath("/records", "layout");
  return { ok: true };
}

export async function listSavedFiltersAction() {
  const who = await requireAccess();
  if (!who.ok) return [];
  return listSavedFilters(RECORDS_LIST.id, who.email);
}

export async function saveFilterAction(input: {
  name: string;
  filter: unknown;
  shared: boolean;
}): Promise<ActionResult> {
  const who = await requireAccess();
  if (!who.ok) return who;

  const name = String(input.name ?? "").trim().slice(0, 60);
  if (!name) {
    return {
      ok: false,
      error: 'Give the favorite a name, for example "Emergency orders".',
    };
  }

  const filter = parseFilter(RECORDS_LIST, input.filter);
  if (isEmptyFilter(filter)) {
    return { ok: false, error: "Build a filter first. There's nothing to save yet." };
  }
  if (input.shared && !who.admin) {
    return { ok: false, error: "Only admins can share favorites with everyone." };
  }

  try {
    await insertSavedFilter({
      listId: RECORDS_LIST.id,
      name,
      filter,
      owner: who.email,
      shared: Boolean(input.shared),
    });
  } catch {
    // The unique indexes are what actually enforce this, so a race between
    // two tabs still ends with one filter, not two.
    return {
      ok: false,
      error: `There's already ${
        input.shared ? "a shared filter" : "a filter"
      } called "${name}". Choose another name.`,
    };
  }

  revalidatePath("/records", "layout");
  return { ok: true };
}

export async function deleteFilterAction(id: number): Promise<ActionResult> {
  const who = await requireAccess();
  if (!who.ok) return who;

  const existing = await getSavedFilter(Number(id));
  if (!existing) return { ok: true };

  const mine = existing.owner_email.toLowerCase() === who.email.toLowerCase();
  if (existing.shared ? !who.admin : !mine) {
    return { ok: false, error: "You can only delete your own saved filters." };
  }

  await deleteSavedFilter(Number(id));
  revalidatePath("/records", "layout");
  return { ok: true };
}
