import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getActiveUser } from "@/lib/users";
import { listByView } from "@/lib/records";
import { RECORDS_LIST } from "@/lib/list-view/registry";
import { applyQuery, parseQuery, toCsv } from "@/lib/list-view/types";
import { viewByKey } from "@/lib/views";

/** Section 21 of docs/standards/list-view.md: all matching rows, up to 10,000. */
const CSV_ROW_LIMIT = 10_000;

/**
 * CSV of EVERY matching row, not just the page on screen - the standard is
 * explicit about that. The permission is re-checked here: an export route is
 * as public as any other endpoint.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ view: string }> }
) {
  const { view: key } = await ctx.params;
  const view = viewByKey(key);
  if (!view) return new Response("Not found", { status: 404 });

  const session = await auth();
  const user = await getActiveUser(session?.user?.email);
  if (!user?.has_project_access) {
    return new Response("Forbidden", { status: 403 });
  }

  const params: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => (params[k] = v));

  const all = await listByView(view.lifecycle, view.activeOnly);
  const matched = applyQuery(RECORDS_LIST, all, parseQuery(RECORDS_LIST, params));

  // The standard's cap. Building the whole CSV in memory is fine for a POC-
  // sized table, but an unbounded export is how a serverless function runs out
  // of memory once the table is real.
  const capped = matched.slice(0, CSV_ROW_LIMIT);

  const filename = `${view.key}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(toCsv(RECORDS_LIST, capped), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
