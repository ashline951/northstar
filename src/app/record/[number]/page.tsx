import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import RecordForm from "@/components/record-form";
import NotOnProject from "@/components/not-on-project";
import { lookupUser } from "@/lib/users";
import { findByNumber, displayNumber } from "@/lib/records";
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
  searchParams: Promise<{ from?: string }>;
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

  const from = viewByKey((await searchParams).from ?? "");
  const backHref = from ? `/records/${from.key}` : "/records/efforts-active";
  const backLabel = from ? from.title : "Active Efforts";

  return (
    <AppShell>
      <RecordForm
        key={canonical}
        record={record}
        backHref={backHref}
        backLabel={backLabel}
      />
    </AppShell>
  );
}
