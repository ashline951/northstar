import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import { lookupUser } from "@/lib/users";
import { listByView } from "@/lib/records";
import { VIEWS, viewByKey } from "@/lib/views";

export async function generateMetadata({ params }: { params: Promise<{ view: string }> }): Promise<Metadata> {
  const view = viewByKey((await params).view);
  return { title: view?.label ?? "Records" };
}

export function generateStaticParams() {
  return VIEWS.map((v) => ({ view: v.key }));
}

export default async function RecordListPage({
  params,
}: {
  params: Promise<{ view: string }>;
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

  const records = await listByView(view.lifecycle, view.activeOnly);

  return (
    <AppShell>
      <div className="px-6 py-10">
        <h1 className="ns-display text-3xl text-[var(--ns-text-primary)]">
          {view.title}
        </h1>
        <p className="mt-2 text-sm text-[var(--ns-text-secondary)]">
          {view.description} — {records.length}{" "}
          {records.length === 1 ? "record" : "records"}.
        </p>

        {/*
          The list view itself is deliberately not built yet. Ryan is supplying
          the house pattern for list views; it drops in here, rendering
          `records` with the filter already applied by `view`.
        */}
        <div className="mt-8 rounded-xl border border-dashed border-[var(--ns-border-subtle)] p-8 text-center">
          <p className="text-sm font-medium text-[var(--ns-text-primary)]">
            List view not built yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ns-text-secondary)]">
            The filter is wired and this view has{" "}
            <strong>{records.length}</strong>{" "}
            {view.activeOnly ? "active " : ""}
            {view.lifecycle.toLowerCase()}
            {records.length === 1 ? "" : "s"} to show. Waiting on the list view
            pattern before rendering them.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
