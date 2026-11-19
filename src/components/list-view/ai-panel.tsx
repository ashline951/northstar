"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Square, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { toSearchParams, type ListQuery, type WireColumn } from "@/lib/list-view/types";
import { RECORDS_LIST_WIRE } from "@/lib/list-view/wire";
import type { Group } from "@/lib/list-view/filter";
import Sparkle from "./sparkle";

type Chart = {
  kind: "bar" | "line";
  title: string;
  categories: string[];
  series: { name: string; values: number[] }[];
};

type Part =
  | { kind: "text"; text: string }
  | { kind: "chart"; chart: Chart }
  | { kind: "filter"; filter: Group; description: string; explanation: string };

type Turn =
  | { role: "user"; text: string }
  | { role: "assistant"; parts: Part[]; status?: string };

/**
 * The ✨ panel - docs/standards/list-view.md section 14.
 *
 * Everything shown here was produced by the server: the numbers come from
 * real queries, and a proposed filter is only ever **shown** with an Apply
 * button. Nothing the assistant suggests changes the list on its own.
 */
export default function AiPanel({
  listId,
  title,
  noun,
  columns,
  privateLabels,
  query,
  onClose,
  onApplyFilter,
}: {
  listId: string;
  title: string;
  noun: string;
  columns: WireColumn[];
  privateLabels: string[];
  query: ListQuery;
  onClose: () => void;
  onApplyFilter: (g: Group) => void;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const firstChoice =
    columns.find((c) => c.type === "choice" && !c.private) ??
    columns.find((c) => !c.private);
  const hasDate = columns.some((c) => c.type === "date");

  const suggestions = [
    `Summarize these ${noun}`,
    firstChoice ? `How many ${noun} per ${firstChoice.label}? Show a chart` : null,
    hasDate ? `Show ${noun} over time by week` : null,
    `Build a filter for ${noun} that…`,
  ].filter((s): s is string => Boolean(s));

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;

    // A suggestion ending in … fills the box instead of asking (section 14.1).
    if (q.endsWith("…")) {
      setInput(q.slice(0, -1));
      return;
    }

    const history = [
      ...turns.map((t) =>
        t.role === "user"
          ? { role: "user" as const, content: t.text }
          : {
              role: "assistant" as const,
              content: t.parts
                .map((p) => (p.kind === "text" ? p.text : ""))
                .join("\n")
                .trim() || "(shown)",
            }
      ),
      { role: "user" as const, content: q },
    ];

    setTurns((t) => [...t, { role: "user", text: q }, { role: "assistant", parts: [], status: "Thinking…" }]);
    setInput("");
    setBusy(true);

    const controller = new AbortController();
    abort.current = controller;

    // The list's current filter, sort and searches go with every question.
    const sp = toSearchParams(RECORDS_LIST_WIRE, query);
    const searchParams: Record<string, string> = {};
    sp.forEach((v, k) => (searchParams[k] = v));

    function update(fn: (turn: Extract<Turn, { role: "assistant" }>) => void) {
      setTurns((all) => {
        const next = [...all];
        const last = next[next.length - 1];
        if (last?.role === "assistant") {
          const copy = { ...last, parts: [...last.parts] };
          fn(copy);
          next[next.length - 1] = copy;
        }
        return next;
      });
    }

    try {
      const res = await fetch(`/api/lists/${listId}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, searchParams }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        update((t) => {
          t.status = undefined;
          t.parts.push({
            kind: "text",
            text:
              res.status === 403 || res.status === 401
                ? "You don't have access to this list."
                : "The AI assistant isn't available right now.",
          });
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(line);
          } catch {
            continue;
          }
          update((t) => {
            switch (event.type) {
              case "text":
                t.status = undefined;
                t.parts.push({ kind: "text", text: String(event.text) });
                break;
              case "status":
                t.status = String(event.text);
                break;
              case "chart":
                t.status = undefined;
                t.parts.push({ kind: "chart", chart: event.chart as Chart });
                break;
              case "filter":
                t.status = undefined;
                t.parts.push({
                  kind: "filter",
                  filter: event.filter as Group,
                  description: String(event.description),
                  explanation: String(event.explanation),
                });
                break;
              case "error":
                t.status = undefined;
                t.parts.push({ kind: "text", text: String(event.message) });
                break;
              case "done":
                t.status = undefined;
                break;
            }
          });
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        update((t) => {
          t.status = undefined;
          t.parts.push({
            kind: "text",
            text: "Something went wrong with the AI assistant. Try again.",
          });
        });
      }
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }

  return (
    <aside
      aria-label={`Ask AI about ${title}`}
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] shadow-2xl"
    >
      <header className="flex items-center gap-2 border-b border-[var(--ns-border-subtle)] px-4 py-3">
        <Sparkle className="size-6" />
        <h2 className="ns-display text-lg text-[var(--ns-text-primary)]">
          Ask AI about {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          title="Close"
          className="ml-auto flex size-8 items-center justify-center rounded-md text-[var(--ns-text-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
        >
          <X aria-hidden className="size-4" />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {turns.length === 0 && (
          <>
            <p className="text-sm text-[var(--ns-text-secondary)]">
              Ask about the {noun} matching your current filter. I can count,
              compare, chart, and build filters.
            </p>
            {privateLabels.length > 0 && (
              <p className="mt-2 text-sm text-[var(--ns-text-secondary)]">
                {privateLabels.join(", ")}{" "}
                {privateLabels.length === 1 ? "is" : "are"} never sent to the
                AI.
              </p>
            )}
            <div className="mt-4 space-y-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => ask(s)}
                  className="block w-full rounded-lg border border-[var(--ns-border-subtle)] px-3 py-2 text-left text-sm text-[var(--ns-text-primary)] hover:border-[var(--ns-nav-primary)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {turns.map((turn, i) =>
          turn.role === "user" ? (
            <div key={i} className="mt-4 flex justify-end">
              <p className="max-w-[85%] rounded-xl bg-black/5 px-3 py-1.5 text-sm text-[var(--ns-text-primary)] dark:bg-white/10">
                {turn.text}
              </p>
            </div>
          ) : (
            <div key={i} className="mt-3 space-y-3">
              {turn.parts.map((part, j) => (
                <PartView
                  key={j}
                  part={part}
                  onApply={() =>
                    part.kind === "filter" && onApplyFilter(part.filter)
                  }
                />
              ))}
              {turn.status && (
                <p className="text-sm text-[var(--ns-text-secondary)]">
                  {turn.status}
                </p>
              )}
            </div>
          )
        )}
        <div ref={bottom} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-end gap-2 border-t border-[var(--ns-border-subtle)] p-3"
      >
        <label className="sr-only" htmlFor="ai-question">
          Your question
        </label>
        <textarea
          id="ai-question"
          rows={2}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          placeholder={`Ask about these ${noun}…`}
          className="min-w-0 flex-1 resize-none rounded-lg border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-3 py-2 text-sm text-[var(--ns-text-primary)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--ns-nav-primary)]"
        />
        {busy ? (
          <button
            type="button"
            onClick={() => abort.current?.abort()}
            aria-label="Stop answering"
            title="Stop"
            className="flex size-10 items-center justify-center rounded-lg border border-[var(--ns-border-subtle)] text-[var(--ns-text-primary)]"
          >
            <Square aria-hidden className="size-4" />
          </button>
        ) : (
          <button
            type="submit"
            aria-label="Ask"
            className="flex size-10 items-center justify-center rounded-lg bg-[var(--ns-nav-primary)] text-white disabled:opacity-50"
            disabled={!input.trim()}
          >
            <Send aria-hidden className="size-4" />
          </button>
        )}
      </form>
    </aside>
  );
}

function PartView({ part, onApply }: { part: Part; onApply: () => void }) {
  if (part.kind === "text") {
    return (
      <p className="text-sm whitespace-pre-wrap text-[var(--ns-text-primary)]">
        {part.text}
      </p>
    );
  }

  if (part.kind === "filter") {
    return (
      <div className="rounded-lg border border-[var(--ns-border-subtle)] p-3">
        <p className="text-sm font-medium text-[var(--ns-text-primary)]">
          {part.description}
        </p>
        {part.explanation && (
          <p className="mt-1 text-sm text-[var(--ns-text-secondary)]">
            {part.explanation}
          </p>
        )}
        {/* Nothing is applied unless the person chooses it - section 14.2. */}
        <button
          type="button"
          onClick={onApply}
          className="mt-3 rounded-lg bg-[var(--ns-nav-primary)] px-3 py-1.5 text-sm font-medium text-white"
        >
          Apply filter
        </button>
      </div>
    );
  }

  return <ChartView chart={part.chart} />;
}

/** Horizontal bars, with the numbers shown - the chart never stands alone. */
function ChartView({ chart }: { chart: Chart }) {
  const [table, setTable] = useState(false);
  const series = chart.series[0];
  const max = Math.max(1, ...chart.series.flatMap((s) => s.values));

  return (
    <div className="rounded-lg border border-[var(--ns-border-subtle)] p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-[var(--ns-text-primary)]">
          {chart.title}
        </p>
        <button
          type="button"
          onClick={() => setTable(!table)}
          className="text-sm text-[var(--ns-nav-primary)] underline-offset-2 hover:underline"
        >
          {table ? "Show chart" : "Show table"}
        </button>
      </div>

      {table ? (
        <table className="mt-2 w-full text-sm">
          <tbody>
            {chart.categories.map((c, i) => (
              <tr key={c} className="border-t border-[var(--ns-border-subtle)]">
                <td className="py-1 text-[var(--ns-text-primary)]">{c}</td>
                <td className="py-1 text-right text-[var(--ns-text-primary)]">
                  {series?.values[i] ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="mt-2 space-y-1">
          {chart.categories.map((c, i) => {
            const v = series?.values[i] ?? 0;
            return (
              <li key={c} className="grid grid-cols-[8rem_1fr_2.5rem] items-center gap-2">
                <span className="truncate text-sm text-[var(--ns-text-secondary)]" title={c}>
                  {c}
                </span>
                <span className="h-3 rounded-sm bg-black/5 dark:bg-white/10">
                  <span
                    className={cn("block h-3 rounded-sm bg-[var(--ns-nav-primary)]")}
                    style={{ width: `${Math.round((v / max) * 100)}%` }}
                  />
                </span>
                <span className="text-right text-sm text-[var(--ns-text-primary)]">
                  {v}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
