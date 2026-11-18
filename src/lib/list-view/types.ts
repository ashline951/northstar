import type { ReactNode } from "react";

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

  const perRaw = Number(one("per"));
  const perPage = (PER_PAGE_OPTIONS as readonly number[]).includes(perRaw)
    ? perRaw
    : DEFAULT_PER_PAGE;

  const pageRaw = Number(one("page"));
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  return { sortKey, sortDir, search, page, perPage };
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
  if (q.perPage !== DEFAULT_PER_PAGE) p.set("per", String(q.perPage));
  if (q.page > 1) p.set("page", String(q.page));
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

  // A row must match EVERY filled search box.
  const filtered = rows.filter((row) =>
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
    if (col.type === "date") {
      const at = Date.parse(av) || 0;
      const bt = Date.parse(bv) || 0;
      return (at - bt) * dir;
    }
    return av.localeCompare(bv, undefined, { numeric: true }) * dir;
  });
}

export function toCsv<Row>(def: ListDef<Row>, rows: Row[]): string {
  const esc = (v: string) => {
    // Titles are free text. A cell opening with = + - or @ is run as a formula
    // by Excel and Sheets, so a record titled =HYPERLINK(...) would execute on
    // whoever opens the export. A leading apostrophe makes it literal text.
    const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
    return /[",\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
  };
  const head = def.columns.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) =>
    def.columns.map((c) => esc(c.value(r))).join(",")
  );
  return [head, ...body].join("\n");
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
};

export type WireRow = {
  id: number;
  cells: Record<string, string>;
  /** Where clicking the row goes; omitted when rows are not clickable. */
  href?: string;
};

export function wireColumns<Row>(def: ListDef<Row>): WireColumn[] {
  return def.columns.map(({ key, label, type, width }) => ({
    key,
    label,
    type,
    width,
  }));
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
