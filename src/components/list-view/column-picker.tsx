"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import type { WireColumn } from "@/lib/list-view/types";

/**
 * The column picker - docs/standards/list-view.md section 3.
 *
 * A slush bucket: Available on the left, Selected on the right, moved with
 * buttons and ordered with buttons. Section 18 is explicit that this is
 * buttons rather than drag and drop, because it has to work from a keyboard
 * and with gloves on.
 */
export default function ColumnPicker({
  columns,
  selected,
  onSave,
  onCancel,
}: {
  columns: WireColumn[];
  selected: string[];
  onSave: (keys: string[]) => void;
  onCancel: () => void;
}) {
  const [chosen, setChosen] = useState<string[]>(selected);
  const [markedAvailable, setMarkedAvailable] = useState<string[]>([]);
  const [markedSelected, setMarkedSelected] = useState<string[]>([]);
  const [find, setFind] = useState("");

  const byKey = new Map(columns.map((c) => [c.key, c]));
  const available = columns
    .filter((c) => !chosen.includes(c.key))
    .filter((c) => c.label.toLowerCase().includes(find.trim().toLowerCase()));

  function add() {
    setChosen([...chosen, ...markedAvailable]);
    setMarkedAvailable([]);
  }

  function remove() {
    setChosen(chosen.filter((k) => !markedSelected.includes(k)));
    setMarkedSelected([]);
  }

  /** Moves the marked columns one place, keeping their order among themselves. */
  function move(by: -1 | 1) {
    const next = [...chosen];
    const order = by === -1 ? [...next.keys()] : [...next.keys()].reverse();
    for (const i of order) {
      if (!markedSelected.includes(next[i])) continue;
      const j = i + by;
      if (j < 0 || j >= next.length) continue;
      if (markedSelected.includes(next[j])) continue;
      [next[i], next[j]] = [next[j], next[i]];
    }
    setChosen(next);
  }

  const box =
    "h-56 w-full overflow-y-auto rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-1";
  const arrow =
    "flex size-11 items-center justify-center rounded-md border border-[var(--ns-border-subtle)] text-[var(--ns-text-primary)] hover:border-[var(--ns-nav-primary)] disabled:opacity-40";

  function option(
    key: string,
    label: string,
    marked: string[],
    setMarked: (v: string[]) => void,
    onDouble: () => void
  ) {
    const on = marked.includes(key);
    return (
      <button
        key={key}
        type="button"
        aria-pressed={on}
        onDoubleClick={onDouble}
        onClick={(e) =>
          // Ctrl/Cmd or Shift picks several, as the wireframe's help says.
          setMarked(
            e.ctrlKey || e.metaKey || e.shiftKey
              ? on
                ? marked.filter((k) => k !== key)
                : [...marked, key]
              : on && marked.length === 1
                ? []
                : [key]
          )
        }
        className={`block w-full rounded px-2 py-1 text-left text-sm ${
          on
            ? "bg-[var(--ns-nav-primary)] text-white"
            : "text-[var(--ns-text-primary)] hover:bg-black/5 dark:hover:bg-white/5"
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="columns-title"
        className="relative w-full max-w-2xl rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-5 shadow-xl"
      >
        <h2
          id="columns-title"
          className="ns-display text-xl text-[var(--ns-text-primary)]"
        >
          Columns
        </h2>
        <p className="mt-1 text-sm text-[var(--ns-text-secondary)]">
          Select columns and use the arrows, or double-click to move one
          across. Selected columns show left to right in the order listed. Hold
          Ctrl (⌘ on a Mac) or Shift to pick several. Only your view changes.
        </p>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr_auto] items-start gap-3">
          <div>
            <p className="mb-1 text-sm font-medium text-[var(--ns-text-primary)]">
              Available ({available.length})
            </p>
            <input
              value={find}
              onChange={(e) => setFind(e.target.value)}
              aria-label="Find a column"
              placeholder="Find a column"
              className="mb-1 h-9 w-full rounded-md border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-2 text-sm text-[var(--ns-text-primary)]"
            />
            <div className={box}>
              {available.map((c) =>
                option(c.key, c.label, markedAvailable, setMarkedAvailable, () =>
                  setChosen([...chosen, c.key])
                )
              )}
            </div>
          </div>

          <div className="mt-13 flex flex-col gap-2">
            <button
              type="button"
              onClick={add}
              disabled={!markedAvailable.length}
              aria-label="Add selected columns"
              title="Add"
              className={arrow}
            >
              <ChevronRight aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={!markedSelected.length}
              aria-label="Remove selected columns"
              title="Remove"
              className={arrow}
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>
          </div>

          <div>
            <p className="mb-1 text-sm font-medium text-[var(--ns-text-primary)]">
              Selected ({chosen.length})
            </p>
            <div className="mb-1 h-9" />
            <div className={box}>
              {chosen.map((key) =>
                option(
                  key,
                  byKey.get(key)?.label ?? key,
                  markedSelected,
                  setMarkedSelected,
                  () => setChosen(chosen.filter((k) => k !== key))
                )
              )}
            </div>
          </div>

          <div className="mt-13 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={!markedSelected.length}
              aria-label="Move selected columns up (left)"
              title="Move up"
              className={arrow}
            >
              <ChevronUp aria-hidden className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              disabled={!markedSelected.length}
              aria-label="Move selected columns down (right)"
              title="Move down"
              className={arrow}
            >
              <ChevronDown aria-hidden className="size-5" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[var(--ns-border-subtle)] px-4 py-2 text-sm text-[var(--ns-text-primary)] hover:border-[var(--ns-nav-primary)]"
          >
            Cancel
          </button>
          <button
            type="button"
            // No columns at all would be a list of nothing, so the registry's
            // columns stand in - the same rule the server applies.
            onClick={() => onSave(chosen.length ? chosen : columns.map((c) => c.key))}
            className="rounded-lg bg-[var(--ns-nav-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Save columns
          </button>
        </div>
      </div>
    </div>
  );
}
