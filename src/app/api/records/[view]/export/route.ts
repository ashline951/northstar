import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getActiveUser } from "@/lib/users";
import { listByView } from "@/lib/records";
import { RECORDS_LIST } from "@/lib/list-view/registry";
import { applyQuery, parseQuery, toCsv } from "@/lib/list-view/types";
import { viewByKey } from "@/lib/views";
import { effectiveLayout } from "@/app/records/list-actions";

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

  // The same layout precedence as the page, so the export matches the screen.
  const layout = await effectiveLayout(user.email);
  const withLayout: Record<string, string> = {
    ...(layout
      ? {
          sort: `${layout.sort.column}.${layout.sort.dir}`,
          ...(layout.filter?.items?.length
            ? { filter: JSON.stringify(layout.filter) }
            : {}),
        }
      : {}),
    ...params,
  };

  const all = await listByView(view.lifecycle, view.activeOnly);
  const matched = applyQuery(RECORDS_LIST, all, parseQuery(RECORDS_LIST, withLayout));

  // The standard's cap. Building the whole CSV in memory is fine for a POC-
  // sized table, but an unbounded export is how a serverless function runs out
  // of memory once the table is real.
  const capped = matched.slice(0, CSV_ROW_LIMIT);

  // Section 13: <app>-<list>-<date>.csv, dated in the app's time zone.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
  }).format(new Date());
  const filename = `northstar-${view.key}-${today}.csv`;
  return new Response(toCsv(RECORDS_LIST, capped, layout?.columns), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
