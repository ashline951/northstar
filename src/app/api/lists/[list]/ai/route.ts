import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getActiveUser } from "@/lib/users";
import { listByView } from "@/lib/records";
import { RECORDS_LIST } from "@/lib/list-view/registry";
import {
  applyQuery,
  parseQuery,
  type ListQuery,
} from "@/lib/list-view/types";
import {
  COMPARISON_LABEL,
  describeNode,
  isEmptyFilter,
  parseFilter,
  publicColumns,
  redactPrivate,
  type Group,
} from "@/lib/list-view/filter";
import { viewByKey } from "@/lib/views";
import type { NorthstarRecord } from "@/lib/records";

/**
 * The list assistant - docs/standards/list-view.md section 14.
 *
 * Two rules decide the shape of this file, and neither bends:
 *
 *  1. **Every number comes from a real query.** The model cannot count. It
 *     calls count_rows, which runs the same filter the person is looking at
 *     over the same rows the page reads, and returns totals. If a question
 *     cannot be answered by a query, it does not get a number.
 *
 *  2. **Nothing from a private column reaches the model.** Not a value, not a
 *     filter condition, not a search term, not a column it could group by.
 *     The private conditions are stripped before the view is described
 *     (section 14.4), and the server still applies the real ones, so the
 *     counts the model is given remain true.
 */

export const runtime = "nodejs";
export const maxDuration = 60;

// Section 14.5: the app's reasoning model for typed questions, a faster one
// at low effort for spoken ones.
const MODEL = "claude-opus-5-5";
const VOICE_MODEL = "claude-sonnet-5-5";
const MAX_STEPS = 8;
const MAX_HISTORY = 20;
const MAX_MESSAGE = 4000;

type Event =
  | { type: "text"; text: string }
  | { type: "status"; text: string }
  | { type: "chart"; chart: Chart }
  | { type: "filter"; filter: Group; description: string; explanation: string }
  | { type: "error"; message: string }
  | { type: "done" };

type Chart = {
  kind: "bar" | "line";
  title: string;
  categories: string[];
  series: { name: string; values: number[] }[];
};

const PUBLIC = publicColumns(RECORDS_LIST);
const PRIVATE_LABELS = RECORDS_LIST.columns
  .filter((c) => c.private)
  .map((c) => c.label);

function isPublic(key: string): boolean {
  return PUBLIC.some((c) => c.key === key);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ list: string }> }
) {
  // Section 14.4: the assistant inherits the list's permission, checked here
  // rather than only on the page.
  const session = await auth();
  const user = await getActiveUser(session?.user?.email);
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!user?.has_project_access) {
    return new Response("Forbidden", { status: 403 });
  }

  const { list } = await ctx.params;
  const view = viewByKey(list);
  if (!view) return new Response("Not found", { status: 404 });

  const body = (await req.json()) as {
    messages?: { role: "user" | "assistant"; content: string }[];
    searchParams?: Record<string, string>;
    voice?: boolean;
    warm?: boolean;
  };

  // Section 14.5: a warm call makes the first spoken answer faster.
  if (body.warm) return new Response(null, { status: 204 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return stream(async (send) => {
      send({
        type: "error",
        message:
          "The AI assistant isn't set up yet. An admin needs to add the Anthropic API key in Vercel.",
      });
    });
  }

  const all = await listByView(view.lifecycle, view.activeOnly);
  const query = parseQuery(RECORDS_LIST, body.searchParams ?? {});
  const matching = applyQuery(RECORDS_LIST, all, query);

  const history = (body.messages ?? [])
    .slice(-MAX_HISTORY)
    .map((m) => ({
      role: m.role,
      content: String(m.content ?? "").slice(0, MAX_MESSAGE),
    }))
    .filter((m) => m.content.trim());

  if (!history.length) {
    return stream(async (send) => send({ type: "error", message: "Ask a question first." }));
  }

  const client = new Anthropic();
  const voice = Boolean(body.voice);

  return stream(async (send) => {
    const messages: Anthropic.Beta.BetaMessageParam[] = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      for (let step = 0; step < MAX_STEPS; step++) {
        const response = await client.beta.messages.create({
          model: voice ? VOICE_MODEL : MODEL,
          max_tokens: 4096,
          // Section 14.5: medium for typed questions, low when spoken.
          output_config: { effort: voice ? "low" : "medium" },
          // A declined request retries on the recommended fallback rather
          // than leaving the person with nothing.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: buildSystem(view.title, query, matching.length, all.length, voice),
          tools: TOOLS,
          messages,
        });

        if (response.stop_reason === "refusal") {
          send({
            type: "error",
            message: "The assistant couldn't help with that request.",
          });
          return;
        }

        const toolUses = response.content.filter(
          (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use"
        );

        for (const block of response.content) {
          if (block.type === "text" && block.text.trim()) {
            send({ type: "text", text: block.text });
          }
        }

        if (!toolUses.length) {
          send({ type: "done" });
          return;
        }

        messages.push({ role: "assistant", content: response.content });

        const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
        for (const use of toolUses) {
          send({ type: "status", text: STATUS[use.name] ?? "Working…" });
          const out = runTool(use.name, use.input, {
            query,
            matching,
            send,
          });
          results.push({
            type: "tool_result",
            tool_use_id: use.id,
            content: JSON.stringify(out.result),
            ...(out.isError ? { is_error: true } : {}),
          });
        }
        messages.push({ role: "user", content: results });
      }

      send({
        type: "text",
        text: "(Stopped: that took too many steps. Try a simpler question.)",
      });
      send({ type: "done" });
    } catch (err) {
      send({ type: "error", message: plainError(err) });
    }
  });
}

const STATUS: Record<string, string> = {
  count_rows: "Counting…",
  list_rows: "Looking at rows…",
  propose_filter: "Building a filter…",
  show_chart: "Drawing a chart…",
};

/** Section 14.7: the person reads plain words, not a provider's error code. */
function plainError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return "The AI key in Vercel isn't working. An admin needs to check ANTHROPIC_API_KEY.";
  }
  if (err instanceof Anthropic.RateLimitError) {
    return "The AI service is busy. Wait a moment and try again.";
  }
  console.error("List assistant failed", err);
  return "Something went wrong with the AI assistant. Try again.";
}

/** Newline-separated JSON, as section 14.6 specifies. */
function stream(run: (send: (e: Event) => void) => Promise<void>): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (e: Event) =>
        controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
      try {
        await run(send);
      } finally {
        controller.close();
      }
    },
  });
  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * What the model is told about the list. Section 14.4 decides what is left
 * out: the private columns are named so it can explain why it cannot use
 * them, but no value, condition or search on them is ever included.
 */
function buildSystem(
  title: string,
  query: ListQuery,
  matched: number,
  grand: number,
  voice: boolean
): string {
  const { filter, hadPrivate } = redactPrivate(RECORDS_LIST, query.filter);

  const publicSearches = Object.entries(query.search).filter(([k]) =>
    isPublic(k)
  );
  const hiddenSearches = Object.keys(query.search).length - publicSearches.length;

  const lines = [
    `You are the assistant on the "${title}" list in Northstar, Loma Linda University Health's project portfolio tool.`,
    "",
    "Rules you must not break:",
    "- Every number you give must come from a tool result. Never count rows yourself, and never estimate. If a question cannot be answered with the tools, say so.",
    "- Answer only about this list. Decline anything clinical, and never accept or repeat patient information, even if someone says it is fake or approved.",
    `- These columns are hidden from you and always will be: ${
      PRIVATE_LABELS.join(", ") || "none"
    }. You cannot read, filter, group or chart them. If asked, say the column is not available to you.`,
    "- Propose a filter when asked to build one. It is shown to the person with an Apply button; you never apply it yourself.",
    "",
    `Today is ${new Date().toISOString().slice(0, 10)}.`,
    "",
    "Columns you may use (key · label · type):",
    ...PUBLIC.map((c) => `- ${c.key} · ${c.label} · ${c.type}`),
    "",
    "States belong to a lifecycle: Idea (Draft, Submitted, Accepted, Idea Closed); Demand (Draft, Submitted, Screening, Qualified, Approved, Deferred, DMND Closed); Project (Initiate, Plan, Execute, Monitor/Control, Prj Closed).",
    "",
    `The person is looking at ${matched} of ${grand} rows.`,
    isEmptyFilter(filter)
      ? "There is no filter on the visible columns."
      : `Filter: ${describeNode({ columns: PUBLIC }, filter)}`,
    hadPrivate ? "The filter also has conditions on hidden columns." : "",
    publicSearches.length
      ? `Column searches: ${publicSearches
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")}`
      : "",
    hiddenSearches ? "There are also searches on hidden columns." : "",
    "",
    `Comparisons available in a filter: ${Object.values(COMPARISON_LABEL).join(", ")}.`,
  ];

  if (voice) {
    lines.push(
      "",
      "This is a spoken conversation. Answer in one to three short plain sentences, with no markdown. Before using a tool, say a three-to-six-word lead-in."
    );
  }

  return lines.filter(Boolean).join("\n");
}

const TOOLS: Anthropic.Beta.BetaToolUnion[] = [
  {
    name: "count_rows",
    description:
      "Count the rows the person is looking at. Optionally group by one or two columns. This is the only way to get a number.",
    input_schema: {
      type: "object",
      properties: {
        group_by: {
          type: "array",
          items: { type: "string" },
          description: "One or two column keys to group by.",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "list_rows",
    description:
      "A few example rows, for describing them. Never use this to count.",
    input_schema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "1 to 25. Default 10." },
        columns: {
          type: "array",
          items: { type: "string" },
          description: "Up to 12 column keys.",
        },
      },
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "propose_filter",
    description:
      "Offer the person a filter to apply. It is only shown; they choose whether to apply it.",
    input_schema: {
      type: "object",
      properties: {
        filter: { type: "object", description: "A filter group." },
        explanation: {
          type: "string",
          description: "At most 300 characters, in plain words.",
        },
      },
      required: ["filter", "explanation"],
      additionalProperties: false,
    },
  },
  {
    name: "show_chart",
    description: "Draw a chart from numbers you already got from count_rows.",
    input_schema: {
      type: "object",
      properties: {
        kind: { type: "string", enum: ["bar", "line"] },
        title: { type: "string" },
        categories: { type: "array", items: { type: "string" } },
        series: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              values: { type: "array", items: { type: "number" } },
            },
            required: ["name", "values"],
            additionalProperties: false,
          },
        },
      },
      required: ["kind", "title", "categories", "series"],
      additionalProperties: false,
    },
  },
];

const MAX_CHART_CATEGORIES = 60;
const MAX_SERIES = 4;
const MAX_COUNT_GROUPS = 50;

function runTool(
  name: string,
  input: unknown,
  ctx: {
    query: ListQuery;
    matching: NorthstarRecord[];
    send: (e: Event) => void;
  }
): { result: unknown; isError?: boolean } {
  const args = (input ?? {}) as Record<string, unknown>;

  if (name === "count_rows") {
    const keys = Array.isArray(args.group_by)
      ? (args.group_by as string[]).slice(0, 2)
      : [];
    // A private column is refused outright rather than quietly ignored, so
    // the model learns it cannot have it.
    const refused = keys.find((k) => !isPublic(k));
    if (refused) {
      return {
        result: { error: `The column "${refused}" is not available to you.` },
        isError: true,
      };
    }
    if (!keys.length) return { result: { total: ctx.matching.length } };

    const cols = keys.map((k) => RECORDS_LIST.columns.find((c) => c.key === k)!);
    const counts = new Map<string, number>();
    for (const row of ctx.matching) {
      const label = cols.map((c) => c.value(row) || "(empty)").join(" · ");
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    const sorted = [...counts].sort((a, b) => b[1] - a[1]);
    return {
      result: {
        total: ctx.matching.length,
        groups: sorted
          .slice(0, MAX_COUNT_GROUPS)
          .map(([label, count]) => ({ label, count })),
        truncated: sorted.length > MAX_COUNT_GROUPS,
      },
    };
  }

  if (name === "list_rows") {
    const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 25);
    const wanted = Array.isArray(args.columns)
      ? (args.columns as string[]).slice(0, 12)
      : PUBLIC.map((c) => c.key);
    // Private columns are dropped here too, not only refused above: a model
    // asking for one gets the rest, without the hidden values.
    const cols = wanted
      .filter(isPublic)
      .map((k) => RECORDS_LIST.columns.find((c) => c.key === k)!)
      .filter(Boolean);
    return {
      result: {
        matching: ctx.matching.length,
        rows: ctx.matching.slice(0, limit).map((row) =>
          Object.fromEntries(cols.map((c) => [c.key, c.value(row)]))
        ),
      },
    };
  }

  if (name === "propose_filter") {
    const filter = parseFilter(RECORDS_LIST, args.filter);
    const { hadPrivate } = redactPrivate(RECORDS_LIST, filter);
    if (hadPrivate) {
      return {
        result: { error: "That filter uses a column that is not available to you." },
        isError: true,
      };
    }
    if (isEmptyFilter(filter)) {
      return { result: { error: "That filter had no usable conditions." }, isError: true };
    }
    const description = describeNode({ columns: PUBLIC }, filter);
    ctx.send({
      type: "filter",
      filter,
      description,
      explanation: String(args.explanation ?? "").slice(0, 300),
    });
    return { result: { shown: true, description } };
  }

  if (name === "show_chart") {
    const categories = (Array.isArray(args.categories) ? args.categories : [])
      .slice(0, MAX_CHART_CATEGORIES)
      .map(String);
    const series = (Array.isArray(args.series) ? args.series : [])
      .slice(0, MAX_SERIES)
      .map((s) => {
        const o = s as { name?: unknown; values?: unknown };
        return {
          name: String(o.name ?? ""),
          // One value per category, and anything that is not a number is 0 -
          // a chart must not invent a shape out of a missing value.
          values: categories.map((_, i) => {
            const v = Array.isArray(o.values) ? Number(o.values[i]) : NaN;
            return Number.isFinite(v) ? v : 0;
          }),
        };
      });

    if (!categories.length || !series.length) {
      return { result: { error: "A chart needs categories and at least one series." }, isError: true };
    }

    const chart: Chart = {
      kind: args.kind === "line" ? "line" : "bar",
      title: String(args.title ?? ""),
      categories,
      series,
    };
    ctx.send({ type: "chart", chart });
    return { result: { shown: true } };
  }

  return { result: { error: `No tool called ${name}.` }, isError: true };
}
