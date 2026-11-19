import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import ListView from "@/components/list-view/list-view";
import NotOnProject from "@/components/not-on-project";
import { lookupUser, ROLE_PROJECT_MANAGER } from "@/lib/users";
import { STATES, displayNumber, listByView } from "@/lib/records";
import { RECORDS_LIST } from "@/lib/list-view/registry";
import {
  applyQuery,
  parseQuery,
  toSearchParams,
  wireColumns,
  wireRows,
} from "@/lib/list-view/types";
import { effectiveLayout } from "@/app/records/list-actions";
import { listSavedFilters } from "@/lib/list-view/store";
import { allViewFor, viewByKey, viewSteps } from "@/lib/views";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ view: string }>;
}): Promise<Metadata> {
  const view = viewByKey((await params).view);
  return { title: view?.label ?? "Records" };
}

// Per-person data behind an authorization check: never prerender this, and so
// no generateStaticParams. Without it the build labels the route SSG, which is
// one refactor away from being true, and a cached list view would be the wrong
// person's rows.
export const dynamic = "force-dynamic";

export default async function RecordListPage({
  params,
  searchParams,
}: {
  params: Promise<{ view: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { view: key } = await params;
  const view = viewByKey(key);
  if (!view) notFound();

  const session = await auth();
  const lookup = await lookupUser(session?.user?.email);
  if (lookup.status === "unavailable") return <ServiceUnavailable />;
  const me = lookup.status === "ok" ? lookup.user : null;
  if (!me?.has_project_access) return <NotOnProject />;

  const sp = await searchParams;

  // Section 12: each of filter, sort, group and rows comes from the URL if it
  // is there, otherwise from the person's saved view, otherwise the admin
  // default, otherwise the registry. Columns are never in the URL.
  const layout = await effectiveLayout(me.email);
  const withLayout: Record<string, string | string[] | undefined> = {
    ...(layout
      ? {
          sort: `${layout.sort.column}.${layout.sort.dir}`,
          ...(layout.groupBy ? { group: layout.groupBy } : {}),
          ...(layout.pageSize ? { rows: String(layout.pageSize) } : {}),
          ...(layout.filter?.items?.length
            ? { filter: JSON.stringify(layout.filter) }
            : {}),
        }
      : {}),
    ...sp,
  };

  const query = parseQuery(RECORDS_LIST, withLayout);
  const all = await listByView(view.lifecycle, view.activeOnly);
  const matched = applyQuery(RECORDS_LIST, all, query);

  // A grouped list is not paged: counts on the group headers have to be the
  // real totals, not "how many of this group happen to be on page 2". The cap
  // keeps one ungrouped-by-accident click from sending 50,000 rows.
  const GROUPED_ROW_LIMIT = 2000;
  const page = query.groupKey
    ? matched.slice(0, GROUPED_ROW_LIMIT)
    : matched.slice(
        (query.page - 1) * query.perPage,
        query.page * query.perPage
      );

  const exportParams = toSearchParams(RECORDS_LIST, query);
  exportParams.delete("page");
  exportParams.delete("rows");

  const favorites = await listSavedFilters(RECORDS_LIST.id, me.email);
  // On one lifecycle's list, State offers only that lifecycle's states.
  const columns = wireColumns(RECORDS_LIST).map((c) =>
    c.key === "state" && view.lifecycle ? { ...c, options: [...STATES[view.lifecycle]] } : c
  );
  const selectedKeys =
    layout?.columns?.length ? layout.columns : columns.map((c) => c.key);

  return (
    <AppShell>
      <ListView
        listId={view.key}
        columns={columns}
        selectedKeys={selectedKeys}
        rows={wireRows(
          RECORDS_LIST,
          page,
          // `from` brings people back to the list they started in.
          (r) => `/record/${displayNumber(r)}?from=${view.key}`
        )}
        noun={RECORDS_LIST.noun}
        total={matched.length}
        grandTotal={all.length}
        query={query}
        title={view.title}
        trail={{
          allHref: `/records/${allViewFor(view).key}`,
          viewSteps: viewSteps(view),
          withoutViewHref: `/records/${allViewFor(view).key}`,
        }}
        exportHref={`/api/records/${view.key}/export?${exportParams.toString()}`}
        createHref={`/record/new?from=${view.key}${
          view.lifecycle ? `&lifecycle=${view.lifecycle}` : ""
        }`}
        createLabel={`New ${view.lifecycle ?? "Idea"}`}
        favorites={favorites}
        isAdmin={me.role === ROLE_PROJECT_MANAGER}
        myEmail={me.email}
      />
    </AppShell>
  );
}
