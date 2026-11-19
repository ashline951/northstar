import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import ListView from "@/components/list-view/list-view";
import { lookupUser } from "@/lib/users";
import { displayNumber, listByView } from "@/lib/records";
import { RECORDS_LIST } from "@/lib/list-view/registry";
import {
  applyQuery,
  parseQuery,
  toSearchParams,
  wireColumns,
  wireRows,
} from "@/lib/list-view/types";
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

  if (!me?.has_project_access) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h1 className="ns-display text-2xl text-[var(--ns-text-primary)]">
            Not part of this project
          </h1>
          <p className="mt-3 text-sm text-[var(--ns-text-secondary)]">
            Record views are limited to the core team.
          </p>
        </div>
      </AppShell>
    );
  }

  // The view fixes the lifecycle and the active filter; the URL supplies sort,
  // per-column search and paging, re-validated against the registry.
  const all = await listByView(view.lifecycle, view.activeOnly);
  const query = parseQuery(RECORDS_LIST, await searchParams);
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
  exportParams.delete("per");

  return (
    <AppShell>
      <ListView
        listId={RECORDS_LIST.id}
        columns={wireColumns(RECORDS_LIST)}
        rows={wireRows(
          RECORDS_LIST,
          page,
          // `from` brings people back to the list they started in.
          (r) => `/record/${displayNumber(r)}?from=${view.key}`
        )}
        noun={RECORDS_LIST.noun}
        total={matched.length}
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
      />
    </AppShell>
  );
}
