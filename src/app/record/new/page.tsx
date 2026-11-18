import type { Metadata } from "next";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import RecordForm from "@/components/record-form";
import NotOnProject from "@/components/not-on-project";
import { lookupUser } from "@/lib/users";
import { LIFECYCLES, type Lifecycle } from "@/lib/records";
import { viewByKey } from "@/lib/views";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "New record" };

export default async function NewRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ lifecycle?: string; from?: string }>;
}) {
  const session = await auth();
  const lookup = await lookupUser(session?.user?.email);
  if (lookup.status === "unavailable") return <ServiceUnavailable />;
  const me = lookup.status === "ok" ? lookup.user : null;
  if (!me?.has_project_access) return <NotOnProject />;

  const { lifecycle: raw, from: fromKey } = await searchParams;

  // An Efforts view spans every lifecycle, so it has no lifecycle to pass and
  // a new record starts where everything starts: as an Idea.
  const lifecycle: Lifecycle = (LIFECYCLES as readonly string[]).includes(
    raw ?? ""
  )
    ? (raw as Lifecycle)
    : "Idea";

  const from = viewByKey(fromKey ?? "");
  const backHref = from ? `/records/${from.key}` : "/records/efforts-active";
  const backLabel = from ? from.title : "Active Efforts";

  return (
    <AppShell>
      <RecordForm
        lifecycle={lifecycle}
        backHref={backHref}
        backLabel={backLabel}
      />
    </AppShell>
  );
}
