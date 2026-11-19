import type { ReactNode } from "react";
import {
  matchesFilter,
  parseFilterParam,
  isEmptyFilter,
  type Group,
} from "./filter";

/**
 * The shared list view - docs/standards/list-view.md.
 *
 * A list declares its columns in a registry; it never gets its own table
 * component. Everything the browser sends (sort, search, page) is re-validated
 * here against that registry before use, because a value from a URL is not to
 * be trusted.
 */

export type ColumnType = "text" | "choice" | "date";

export type Column<Row> = {
  key: string;
  label: string;
  type: ColumnType;
  /** Text used for searching, sorting and CSV - the words people see, never a
   *  database code. */
  value: (row: Row) => string;
  /** Optional custom rendering; falls back to value(). */
  render?: (row: Row) => ReactNode;
  /** Columns holding identifiers that must never reach the AI assistant.
   *  Reserved now so the rule exists before there is anything to protect. */
  private?: boolean;
  width?: string;
};

export type ListDef<Row> = {
  id: string;
  /** Plural noun for counts: "61 projects match". */
  noun: string;
  columns: Column<Row>[];
  defaultSort: { key: string; dir: SortDir };
};

export type SortDir = "asc" | "desc";

export type ListQuery = {
  sortKey: string;
  sortDir: SortDir;
  search: Record<string, string>;
  page: number;
  perPage: number;
  /** Column key to group by, or "" for no grouping. */
  groupKey: string;
  /** The filter builder's tree. An empty group means no filter. */
  filter: Group;
};

export const PER_PAGE_OPTIONS = [10, 20, 50, 100, 500] as const;
export const DEFAULT_PER_PAGE = 50;

export function parseQuery<Row>(
  def: ListDef<Row>,
  params: Record<string, string | string[] | undefined>
): ListQuery {
  const one = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const [rawKey, rawDir] = (one("sort") ?? "").split(".");
  const known = def.columns.some((c) => c.key === rawKey);
  const sortKey = known ? rawKey : def.defaultSort.key;
  const sortDir: SortDir =
    rawDir === "asc" || rawDir === "desc"
      ? rawDir
      : known
        ? "asc"
        : def.defaultSort.dir;

  const search: Record<string, string> = {};
  for (const col of def.columns) {
    const v = one(`q_${col.key}`);
    if (typeof v === "string" && v.trim()) search[col.key] = v.trim();
  }

  // Section 12 calls this `rows`; `per` is still read so links made before
  // the rename keep working.
  const perRaw = Number(one("rows") ?? one("per"));
  const perPage = (PER_PAGE_OPTIONS as readonly number[]).includes(perRaw)
    ? perRaw
    : DEFAULT_PER_PAGE;

  const pageRaw = Number(one("page"));
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const rawGroup = one("group") ?? "";
  // Grouping by a date would make one group per timestamp, which is one group
  // per row and no use to anyone.
  const groupKey = def.columns.some(
    (c) => c.key === rawGroup && c.type !== "date"
  )
    ? rawGroup
    : "";

  const filter = parseFilterParam(def, one("filter"));

  return { sortKey, sortDir, search, page, perPage, groupKey, filter };
}

/** Rebuilds a URL query string from a list query, omitting defaults. */
export function toSearchParams<Row>(
  def: ListDef<Row>,
  q: ListQuery
): URLSearchParams {
  const p = new URLSearchParams();
  if (q.sortKey !== def.defaultSort.key || q.sortDir !== def.defaultSort.dir) {
    p.set("sort", `${q.sortKey}.${q.sortDir}`);
  }
  for (const [k, v] of Object.entries(q.search)) if (v) p.set(`q_${k}`, v);
  if (q.perPage !== DEFAULT_PER_PAGE) p.set("rows", String(q.perPage));
  if (q.page > 1) p.set("page", String(q.page));
  if (q.groupKey) p.set("group", q.groupKey);
  if (!isEmptyFilter(q.filter)) p.set("filter", JSON.stringify(q.filter));
  return p;
}

/**
 * The search operators from the standard. Plain text means "contains" - that
 * is the default and must stay the default.
 *
 *   text     contains            !text    does not contain
 *   =EMER    exactly             !=EMER   not exactly
 *   =        is empty            !=       is not empty
 *   7C*      wildcards (*, % any text; ? one character), whole value
 *
 * Capitals never matter.
 */
export function matchesSearch(cellText: string, term: string): boolean {
  const cell = cellText.toLowerCase();
  let t = term.trim();
  if (!t) return true;

  let negate = false;
  if (t.startsWith("!")) {
    negate = true;
    t = t.slice(1);
  }

  let result: boolean;
  if (t === "=") {
    result = cell === "";
  } else if (t.startsWith("=")) {
    result = cell === t.slice(1).trim().toLowerCase();
  } else if (/[*%?]/.test(t)) {
    // Wildcards match the whole value, as in ServiceNow.
    const escaped = t
      .toLowerCase()
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/[*%]/g, ".*")
      .replace(/\?/g, ".");
    result = new RegExp(`^${escaped}$`).test(cell);
  } else {
    result = cell.includes(t.toLowerCase());
  }

  return negate ? !result : result;
}

/** Applies search, then sort. Returns everything matching, unpaged, so the
 *  caller can report the true count and export all of it. */
export function applyQuery<Row>(
  def: ListDef<Row>,
  rows: Row[],
  q: ListQuery
): Row[] {
  const cols = new Map(def.columns.map((c) => [c.key, c]));

  // A row must match the filter AND every filled search box.
  const filtered = rows.filter(
    (row) =>
      matchesFilter(def, row, q.filter) &&
      Object.entries(q.search).every(([key, term]) => {
        const col = cols.get(key);
        return col ? matchesSearch(col.value(row), term) : true;
      })
  );

  const col = cols.get(q.sortKey);
  if (!col) return filtered;

  const dir = q.sortDir === "asc" ? 1 : -1;
  return [...filtered].sort((a, b) => {
    const av = col.value(a);
    const bv = col.value(b);
    // Section 8: empty values sort last whichever way the column is sorted.
    if (!av && !bv) return 0;
    if (!av) return 1;
    if (!bv) return -1;
    if (col.type === "date") {
      const at = Date.parse(av) || 0;
      const bt = Date.parse(bv) || 0;
      return (at - bt) * dir;
    }
    return av.localeCompare(bv, undefined, { numeric: true }) * dir;
  });
}

export function toCsv<Row>(
  def: ListDef<Row>,
  rows: Row[],
  columnKeys?: string[]
): string {
  // Section 13: every cell quoted, quotes doubled, CRLF line endings, and a
  // byte-order mark so Excel reads it as UTF-8 rather than guessing.
  const esc = (v: string) => {
    // Titles are free text. A cell opening with = + - or @ is run as a formula
    // by Excel and Sheets, so a record titled =HYPERLINK(...) would execute on
    // whoever opens the export. A leading apostrophe makes it literal text.
    const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  // The person's columns, in their order - or every column if none chosen.
  const cols = columnKeys?.length
    ? columnKeys
        .map((k) => def.columns.find((c) => c.key === k))
        .filter((c): c is Column<Row> => Boolean(c))
    : def.columns;
  const head = cols.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) => cols.map((c) => esc(c.value(r))).join(","));
  return "\uFEFF" + [head, ...body].join("\r\n") + "\r\n";
}

/**
 * What actually crosses to the browser.
 *
 * A column's `value()` is a function, and functions cannot be serialised into
 * a Client Component - passing the registry directly throws. So the server
 * evaluates every cell and sends plain strings.
 *
 * That is the better shape anyway: the browser never receives a record object,
 * so a column marked `private` cannot reach it even by accident, and the
 * client has nothing to re-derive.
 */
export type WireColumn = {
  key: string;
  label: string;
  type: ColumnType;
  width?: string;
  /** Shown in the list, but never sent to the model - section 14.4. */
  private?: boolean;
};

export type WireRow = {
  id: number;
  cells: Record<string, string>;
  /** Where clicking the row goes; omitted when rows are not clickable. */
  href?: string;
};

export function wireColumns<Row>(def: ListDef<Row>): WireColumn[] {
  return def.columns.map(({ key, label, type, width, private: isPrivate }) => ({
    key,
    label,
    type,
    width,
    ...(isPrivate ? { private: true } : {}),
  }));
}

export type WireGroup = { label: string; rows: WireRow[] };

/**
 * Groups already-wired rows by one column's text, keeping the order the rows
 * arrived in so the chosen sort still holds inside each group.
 *
 * The standard caps this at 200 groups: past that it is not a grouped list,
 * it is the same list with headings in it, and the browser suffers.
 */
export const MAX_GROUPS = 200;

export function groupRows(rows: WireRow[], key: string): WireGroup[] {
  const map = new Map<string, WireRow[]>();
  for (const row of rows) {
    const label = row.cells[key]?.trim() || "(empty)";
    const bucket = map.get(label);
    if (bucket) bucket.push(row);
    else if (map.size < MAX_GROUPS) map.set(label, [row]);
  }
  // Alphabetical, with the empties last. First-seen order would depend on
  // whatever the sort happens to be, so the same list would group differently
  // from one visit to the next.
  return [...map]
    .map(([label, rows]) => ({ label, rows }))
    .sort((a, b) => {
      if (a.label === "(empty)") return 1;
      if (b.label === "(empty)") return -1;
      return a.label.localeCompare(b.label, undefined, { numeric: true });
    });
}

export function wireRows<Row extends { id: number }>(
  def: ListDef<Row>,
  rows: Row[],
  href?: (row: Row) => string
): WireRow[] {
  return rows.map((row) => ({
    id: row.id,
    cells: Object.fromEntries(def.columns.map((c) => [c.key, c.value(row)])),
    href: href?.(row),
  }));
}
