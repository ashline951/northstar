import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import Avatar from "@/components/Avatar";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-[var(--ns-border-subtle)] py-4 last:border-0">
      <dt className="text-xs tracking-wide text-[var(--ns-text-secondary)] uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-[var(--ns-text-primary)]">
        {value || <span className="text-[var(--ns-text-secondary)]">Not set in Entra</span>}
      </dd>
    </div>
  );
}

export default async function ProfilePage() {
  const u = (await auth())?.user;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="ns-display text-3xl text-[var(--ns-text-primary)]">Profile</h1>
        <p className="mt-2 text-sm text-[var(--ns-text-secondary)]">
          Read from your Loma Linda directory record. To change it, update Entra.
        </p>

        <div className="mt-8 rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-6">
          <div className="flex items-center gap-4">
            <Avatar src={u?.image} name={u?.name} email={u?.email} size={72} />
            <div>
              <p className="text-lg font-semibold text-[var(--ns-text-primary)]">
                {u?.name ?? "Signed in"}
              </p>
              <p className="text-sm text-[var(--ns-text-secondary)]">{u?.jobTitle}</p>
            </div>
          </div>

          <dl className="mt-6">
            <Field label="First name" value={u?.givenName} />
            <Field label="Last name" value={u?.surname} />
            <Field label="Title" value={u?.jobTitle} />
            <Field label="Department" value={u?.department} />
            <Field label="Email" value={u?.email} />
            <Field label="Northstar role" value={u?.role} />
          </dl>
        </div>
      </div>
    </AppShell>
  );
}
