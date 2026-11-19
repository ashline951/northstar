"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  COMPARISON_LABEL,
  MAX_CONDITIONS,
  MAX_DEPTH,
  MAX_VALUE,
  comparisonsFor,
  countConditions,
  needsValue,
  type Comparison,
  type Condition,
  type Group,
} from "@/lib/list-view/filter";
import type { WireColumn } from "@/lib/list-view/types";

/**
 * The filter builder - docs/standards/list-view.md section 10.
 *
 * It edits a draft and **applies only on Run filter**, so a half-built
 * condition never reloads the list. Limits are 3 levels and 30 conditions;
 * the server enforces the same ones, since this is only the browser's copy.
 */
export default function FilterBuilder({
  columns,
  filter,
  onRun,
  onClear,
  onClose,
}: {
  columns: WireColumn[];
  filter: Group;
  onRun: (g: Group) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const first = columns[0];
  const [draft, setDraft] = useState<Group>(() =>
    filter.items.length
      ? structuredClone(filter)
      : {
          kind: "group",
          match: "all",
          items: first ? [newCondition(first)] : [],
        }
  );

  const total = countConditions(draft);
  const full = total >= MAX_CONDITIONS;

  return (
    <section
      aria-label="Filter"
      className="border-b border-[var(--ns-border-subtle)] bg-black/[0.02] px-4 py-3 dark:bg-white/[0.03]"
    >
      <div className="flex items-start justify-between gap-3">
        <GroupEditor
          group={draft}
          columns={columns}
          depth={0}
          full={full}
          onChange={setDraft}
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close filter"
          title="Close filter"
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-[var(--ns-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onRun(draft)}
          className="h-12 rounded-lg bg-[var(--ns-nav-primary)] px-5 text-sm font-medium text-white hover:opacity-90"
        >
          Run filter
        </button>
        <button
          type="button"
          onClick={onClear}
          className="h-12 rounded-lg border border-[var(--ns-border-subtle)] px-4 text-sm text-[var(--ns-text-primary)] hover:border-[var(--ns-nav-primary)]"
        >
          Clear filter
        </button>
        <span className="text-sm text-[var(--ns-text-secondary)]">
          Conditions with an empty value are skipped.
        </span>
      </div>
    </section>
  );
}

function newCondition(col: WireColumn): Condition {
  return {
    kind: "condition",
    column: col.key,
    comparison: comparisonsFor(col.type)[0],
    value: "",
  };
}

const field =
  "min-h-11 rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-2 text-sm text-[var(--ns-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ns-nav-primary)]";

function GroupEditor({
  group,
  columns,
  depth,
  full,
  onChange,
  onRemove,
}: {
  group: Group;
  columns: WireColumn[];
  depth: number;
  full: boolean;
  onChange: (g: Group) => void;
  onRemove?: () => void;
}) {
  const joiner = group.match === "all" ? "and" : "or";
  const canNest = depth + 1 < MAX_DEPTH;

  function setItem(i: number, item: Condition | Group) {
    onChange({ ...group, items: group.items.map((x, j) => (j === i ? item : x)) });
  }

  return (
    <div
      className={cn(
        "min-w-0 flex-1",
        depth > 0 &&
          "rounded-lg border border-[var(--ns-border-subtle)] p-3"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-[var(--ns-text-primary)]">
          {depth === 0 ? "Show rows that match" : "In this group, match"}
        </span>
        <select
          aria-label={depth === 0 ? "Show rows that match" : "In this group, match"}
          value={group.match}
          onChange={(e) =>
            onChange({ ...group, match: e.target.value as "all" | "any" })
          }
          className={field}
        >
          <option value="all">all of these (AND)</option>
          <option value="any">any of these (OR)</option>
        </select>

        {depth > 0 && (
          <>
            <label className="flex items-center gap-1.5 text-sm text-[var(--ns-text-primary)]">
              <input
                type="checkbox"
                checked={Boolean(group.not)}
                onChange={(e) =>
                  onChange({ ...group, not: e.target.checked || undefined })
                }
              />
              Leave these out (NOT)
            </label>
            <button
              type="button"
              onClick={onRemove}
              className="text-sm text-red-700 underline-offset-2 hover:underline dark:text-red-400"
            >
              Remove group
            </button>
          </>
        )}
      </div>

      <div className="mt-2 space-y-2">
        {group.items.map((item, i) => (
          <div key={i}>
            {i > 0 && (
              <p className="py-0.5 text-sm text-[var(--ns-text-secondary)]">
                {joiner}
              </p>
            )}
            {item.kind === "group" ? (
              <GroupEditor
                group={item}
                columns={columns}
                depth={depth + 1}
                full={full}
                onChange={(g) => setItem(i, g)}
                onRemove={() =>
                  onChange({
                    ...group,
                    items: group.items.filter((_, j) => j !== i),
                  })
                }
              />
            ) : (
              <ConditionEditor
                condition={item}
                columns={columns}
                onChange={(c) => setItem(i, c)}
                onRemove={() =>
                  onChange({
                    ...group,
                    items: group.items.filter((_, j) => j !== i),
                  })
                }
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={full || !columns[0]}
          onClick={() =>
            onChange({
              ...group,
              items: [...group.items, newCondition(columns[0])],
            })
          }
          className="inline-flex items-center gap-1 text-sm text-[var(--ns-nav-primary)] underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline"
        >
          <Plus aria-hidden className="size-3.5" />
          Add condition
        </button>

        {/* Hidden at the deepest level rather than disabled: there is nothing
            the person could do to make it work there. */}
        {canNest && (
          <button
            type="button"
            disabled={full || !columns[0]}
            onClick={() =>
              onChange({
                ...group,
                items: [
                  ...group.items,
                  {
                    kind: "group",
                    // A nested group starts as the opposite match of its
                    // parent, which is the only reason to nest one.
                    match: group.match === "all" ? "any" : "all",
                    items: [newCondition(columns[0])],
                  },
                ],
              })
            }
            className="inline-flex items-center gap-1 text-sm text-[var(--ns-nav-primary)] underline-offset-2 hover:underline disabled:opacity-40 disabled:no-underline"
          >
            <Plus aria-hidden className="size-3.5" />
            Add group
          </button>
        )}
      </div>
    </div>
  );
}

function ConditionEditor({
  condition,
  columns,
  onChange,
  onRemove,
}: {
  condition: Condition;
  columns: WireColumn[];
  onChange: (c: Condition) => void;
  onRemove: () => void;
}) {
  const col = columns.find((c) => c.key === condition.column) ?? columns[0];
  const comparisons = comparisonsFor(col.type);
  const label = col.label;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        aria-label="Column"
        value={condition.column}
        onChange={(e) => {
          const next = columns.find((c) => c.key === e.target.value)!;
          const stillValid = comparisonsFor(next.type).includes(
            condition.comparison
          );
          onChange({
            ...condition,
            column: next.key,
            comparison: stillValid
              ? condition.comparison
              : comparisonsFor(next.type)[0],
            // Section 10: another text column keeps the value; another type
            // clears it, because the value would no longer mean anything.
            value: next.type === col.type ? condition.value : "",
          });
        }}
        className={field}
      >
        {columns.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        aria-label={`How to compare ${label}`}
        value={condition.comparison}
        onChange={(e) =>
          onChange({ ...condition, comparison: e.target.value as Comparison })
        }
        className={field}
      >
        {comparisons.map((c) => (
          <option key={c} value={c}>
            {COMPARISON_LABEL[c]}
          </option>
        ))}
      </select>

      {needsValue(condition.comparison) && (
        <input
          aria-label={`Value for ${label} ${COMPARISON_LABEL[condition.comparison]}`}
          type={col.type === "date" ? "date" : "text"}
          maxLength={MAX_VALUE}
          value={condition.value}
          onChange={(e) => onChange({ ...condition, value: e.target.value })}
          className={cn(field, "min-w-48")}
        />
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove condition: ${label} ${COMPARISON_LABEL[condition.comparison]}`}
        title="Remove"
        className="flex size-9 items-center justify-center rounded-md text-[var(--ns-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
      >
        <Trash2 aria-hidden className="size-4" />
      </button>
    </div>
  );
}
