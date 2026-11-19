import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import RecordForm from "@/components/record-form";
import NotOnProject from "@/components/not-on-project";
import { listUsers, lookupUser } from "@/lib/users";
import { findByNumber, displayNumber, historyFor, listGroups } from "@/lib/records";
import { viewByKey } from "@/lib/views";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ number: string }>;
}): Promise<Metadata> {
  // The number only - never the title, which is free text and ends up in the
  // navigator's History.
  return { title: (await params).number.toUpperCase() };
}

export default async function RecordPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ from?: string; edit?: string }>;
}) {
  const session = await auth();
  const lookup = await lookupUser(session?.user?.email);
  if (lookup.status === "unavailable") return <ServiceUnavailable />;
  const me = lookup.status === "ok" ? lookup.user : null;
  if (!me?.has_project_access) return <NotOnProject />;

  const { number } = await params;
  const record = await findByNumber(number);
  if (!record) notFound();

  // A record keeps its suffix but its prefix follows its lifecycle, so an old
  // link (IDEA2600007) still finds the row after promotion.
  const canonical = displayNumber(record);
  const history = await historyFor(record.id);

  const sp = await searchParams;
  const from = viewByKey(sp.from ?? "");
  const backHref = from ? `/records/${from.key}` : "/records/efforts-active";
  const backLabel = from ? from.label : "Active Efforts";

  // Opens read-only; ?edit=1 opens straight into editing, so a link can, and
  // Back from the editor lands on the record rather than the list.
  const editing = sp.edit === "1";
  const [people, groups] = await Promise.all([listUsers(), listGroups()]);

  return (
    <AppShell>
      <RecordForm
        key={canonical}
        record={record}
        history={history}
        editing={editing}
        people={people
          .filter((u) => u.is_active)
          .map((u) => ({ email: u.email, name: u.display_name ?? u.email }))}
        groups={groups}
        from={from?.key}
        backHref={backHref}
        backLabel={backLabel}
      />
    </AppShell>
  );
}
