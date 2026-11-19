/**
 * The filter model from docs/standards/list-view.md section 10.
 *
 * A filter is a tree: a group holds conditions and nested groups, matches
 * "all" (AND) or "any" (OR), and may be negated (NOT). Limits are 3 levels
 * and 30 conditions, enforced HERE rather than only in the builder, because
 * the filter arrives from the URL and nothing from a browser is trusted.
 */

import type { Column, ColumnType, ListDef } from "./types";

export type Comparison =
  | "contains"
  | "notContains"
  | "is"
  | "isNot"
  | "startsWith"
  | "endsWith"
  | "isEmpty"
  | "isNotEmpty"
  | "on"
  | "before"
  | "after";

export type Condition = {
  kind: "condition";
  column: string;
  comparison: Comparison;
  value: string;
};

export type Group = {
  kind: "group";
  match: "all" | "any";
  /** "Leave these out": the group's result is inverted. */
  not?: boolean;
  items: (Condition | Group)[];
};

export const MAX_DEPTH = 3;
export const MAX_CONDITIONS = 30;
export const MAX_VALUE = 200;

/** The words people see, from section 7. */
export const COMPARISON_LABEL: Record<Comparison, string> = {
  contains: "contains",
  notContains: "doesn't contain",
  is: "is",
  isNot: "is not",
  startsWith: "starts with",
  endsWith: "ends with",
  isEmpty: "is empty",
  isNotEmpty: "is not empty",
  on: "on",
  before: "before",
  after: "after",
};

/** Section 10: which comparisons a column type offers. */
export function comparisonsFor(type: ColumnType): Comparison[] {
  if (type === "date") return ["on", "before", "after", "isEmpty", "isNotEmpty"];
  if (type === "choice") return ["is", "isNot", "isEmpty", "isNotEmpty"];
  return [
    "contains",
    "notContains",
    "is",
    "isNot",
    "startsWith",
    "endsWith",
    "isEmpty",
    "isNotEmpty",
  ];
}

export function needsValue(c: Comparison): boolean {
  return c !== "isEmpty" && c !== "isNotEmpty";
}

export const EMPTY_FILTER: Group = { kind: "group", match: "all", items: [] };

export function isEmptyFilter(g: Group): boolean {
  return countConditions(g) === 0;
}

export function countConditions(node: Condition | Group): number {
  if (node.kind === "condition") return 1;
  return node.items.reduce((n, i) => n + countConditions(i), 0);
}

/**
 * Rebuilds a filter from whatever arrived, keeping only what the registry
 * knows about. Anything unrecognised is dropped rather than rejected, so one
 * stale column in a bookmarked URL does not cost someone their whole filter.
 */
export function parseFilter<Row>(def: ListDef<Row>, raw: unknown): Group {
  const cols = new Map(def.columns.map((c) => [c.key, c]));
  let budget = MAX_CONDITIONS;

  function walkGroup(input: unknown, depth: number): Group | null {
    if (!input || typeof input !== "object") return null;
    const g = input as Partial<Group>;
    if (g.kind !== "group" || !Array.isArray(g.items)) return null;

    const items: (Condition | Group)[] = [];
    for (const item of g.items) {
      if (!item || typeof item !== "object") continue;
      if ((item as Group).kind === "group") {
        // Past the depth limit a nested group is flattened away, not kept.
        if (depth + 1 >= MAX_DEPTH) continue;
        const nested = walkGroup(item, depth + 1);
        if (nested && nested.items.length) items.push(nested);
      } else {
        const c = walkCondition(item);
        if (c) items.push(c);
      }
    }
    return {
      kind: "group",
      match: g.match === "any" ? "any" : "all",
      ...(g.not ? { not: true } : {}),
      items,
    };
  }

  function walkCondition(input: unknown): Condition | null {
    if (budget <= 0) return null;
    const c = input as Partial<Condition>;
    const col = typeof c.column === "string" ? cols.get(c.column) : undefined;
    if (!col) return null;

    const allowed = comparisonsFor(col.type);
    const comparison = allowed.includes(c.comparison as Comparison)
      ? (c.comparison as Comparison)
      : allowed[0];

    const value = String(c.value ?? "").trim().slice(0, MAX_VALUE);
    // Section 10: conditions with an empty value are skipped.
    if (needsValue(comparison) && !value) return null;
    // Section 10: a choice value must be one of the column's options.
    if (
      needsValue(comparison) &&
      col.options &&
      !col.options.some((o) => o.toLowerCase() === value.toLowerCase())
    )
      return null;

    budget -= 1;
    return { kind: "condition", column: col.key, comparison, value };
  }

  return walkGroup(raw, 0) ?? { ...EMPTY_FILTER };
}

export function parseFilterParam<Row>(def: ListDef<Row>, raw?: string): Group {
  if (!raw || raw === "all") return { ...EMPTY_FILTER };
  try {
    return parseFilter(def, JSON.parse(raw));
  } catch {
    // A filter that will not parse falls back to showing everything, rather
    // than an error page over a malformed address.
    return { ...EMPTY_FILTER };
  }
}

/** One condition against one row's displayed text. */
function conditionMatches(text: string, c: Condition): boolean {
  const cell = text.trim().toLowerCase();
  const v = c.value.trim().toLowerCase();

  switch (c.comparison) {
    case "contains":
      return cell.includes(v);
    // Section 10: negations keep rows whose value is empty.
    case "notContains":
      return cell === "" || !cell.includes(v);
    case "is":
      return cell === v;
    case "isNot":
      return cell === "" || cell !== v;
    case "startsWith":
      return cell.startsWith(v);
    case "endsWith":
      return cell.endsWith(v);
    case "isEmpty":
      return cell === "";
    case "isNotEmpty":
      return cell !== "";
    case "on":
    case "before":
    case "after": {
      if (cell === "") return false;
      const day = dayOf(text);
      if (!day) return false;
      if (c.comparison === "on") return day === c.value;
      return c.comparison === "before" ? day < c.value : day > c.value;
    }
  }
}

/** The row's date as YYYY-MM-DD, for comparing by day. */
function dayOf(text: string): string | null {
  const t = Date.parse(text);
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString().slice(0, 10);
}

export function matchesFilter<Row>(
  def: ListDef<Row>,
  row: Row,
  group: Group
): boolean {
  const cols = new Map(def.columns.map((c) => [c.key, c]));

  function evalNode(node: Condition | Group): boolean {
    if (node.kind === "condition") {
      const col = cols.get(node.column);
      if (!col) return true;
      return conditionMatches(col.value(row), node);
    }
    const results = node.items.map(evalNode);
    // An empty group matches everything, so a half-built filter shows the
    // list rather than nothing.
    const base =
      results.length === 0
        ? true
        : node.match === "all"
          ? results.every(Boolean)
          : results.some(Boolean);
    return node.not ? !base : base;
  }

  return evalNode(group);
}

/**
 * Section 11: each top-level item is one breadcrumb step.
 *
 * Takes only what it needs - key and label - so the client can describe a
 * filter without the registry's value() functions, which cannot cross the
 * server/client boundary.
 */
export function describeNode(
  def: { columns: { key: string; label: string }[] },
  node: Condition | Group
): string {
  if (node.kind === "condition") {
    const col = def.columns.find((c) => c.key === node.column);
    const label = col?.label ?? node.column;
    const cmp = COMPARISON_LABEL[node.comparison];
    return needsValue(node.comparison)
      ? `${label} ${cmp} ${node.value}`
      : `${label} ${cmp}`;
  }
  const joiner = node.match === "all" ? " and " : " or ";
  const inner = node.items.map((i) => describeNode(def, i)).join(joiner);
  return node.not ? `not (${inner})` : `(${inner})`;
}

/** Drops one top-level step, for a breadcrumb's remove button. */
export function withoutStep(group: Group, index: number): Group {
  return { ...group, items: group.items.filter((_, i) => i !== index) };
}

/** Section 11: keeps the filter up to and including `index`. */
export function throughStep(group: Group, index: number): Group {
  return { ...group, items: group.items.slice(0, index + 1) };
}

/**
 * Section 11: a step from right-click is appended to a plain AND filter;
 * anything else is wrapped so the existing filter keeps its meaning.
 */
export function appendStep(group: Group, step: Condition): Group {
  if (group.match === "all" && !group.not) {
    return { ...group, items: [...group.items, step] };
  }
  return { kind: "group", match: "all", items: [group, step] };
}

/** Public columns only - section 14.4 keeps private ones from the model. */
export function publicColumns<Row>(def: ListDef<Row>): Column<Row>[] {
  return def.columns.filter((c) => !c.private);
}

/**
 * Strips every condition on a private column, and reports whether any were
 * removed. Section 14.4: the model is told that hidden conditions exist, but
 * never what they are. The server still applies the real filter.
 */
export function redactPrivate<Row>(
  def: ListDef<Row>,
  group: Group
): { filter: Group; hadPrivate: boolean } {
  const privateKeys = new Set(
    def.columns.filter((c) => c.private).map((c) => c.key)
  );
  let hadPrivate = false;

  function walk(g: Group): Group {
    const items: (Condition | Group)[] = [];
    for (const item of g.items) {
      if (item.kind === "condition") {
        if (privateKeys.has(item.column)) hadPrivate = true;
        else items.push(item);
      } else {
        items.push(walk(item));
      }
    }
    return { ...g, items };
  }

  return { filter: walk(group), hadPrivate };
}
