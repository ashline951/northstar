import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import {
  ROLE_MEMBER,
  ROLE_PROJECT_MANAGER,
  listUsers,
  lookupUser,
} from "@/lib/users";
import { listNotes } from "@/lib/assistant";
import { migrationState } from "@/lib/migrations";
import ServiceUnavailable from "@/components/ServiceUnavailable";
import {
  addNoteAction,
  addUserAction,
  deactivateUserAction,
  deleteNoteAction,
  resetWelcomeAction,
  runMigrationsAction,
  setProjectAccessAction,
  setRoleAction,
} from "./actions";

export default async function AdminPage() {
  const session = await auth();
  const lookup = await lookupUser(session?.user?.email);

  if (lookup.status === "unavailable") return <ServiceUnavailable />;

  const me = lookup.status === "ok" ? lookup.user : null;

  if (!me || me.role !== ROLE_PROJECT_MANAGER) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl px-6 py-16 text-center">
          <h1 className="ns-display text-2xl text-[var(--ns-text-primary)]">
            Project managers only
          </h1>
          <p className="mt-3 text-sm text-[var(--ns-text-secondary)]">
            Managing who can use Northstar is restricted to project managers.
          </p>
        </div>
      </AppShell>
    );
  }

  const users = await listUsers();
  const notes = await listNotes();
  const migrations = await migrationState();
  const pending = migrations.filter((m) => !m.applied_at);
  const input =
    "w-full rounded-lg border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-3 py-2 text-sm text-[var(--ns-text-primary)]";

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="ns-display text-3xl text-[var(--ns-text-primary)]">
          Who can use Northstar
        </h1>
        <p className="mt-2 text-sm text-[var(--ns-text-secondary)]">
          Anyone at Loma Linda can sign in with Microsoft, but only the people
          listed here are let through.
        </p>

        <form
          action={addUserAction}
          className="mt-8 grid gap-3 rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-5 sm:grid-cols-[1fr_1fr_auto_auto]"
        >
          <input name="email" type="email" required placeholder="name@llu.edu" className={input} />
          <input name="display_name" placeholder="Name (optional)" className={input} />
          <select name="role" className={input} defaultValue={ROLE_MEMBER}>
            <option value={ROLE_MEMBER}>Member</option>
            <option value={ROLE_PROJECT_MANAGER}>Project Manager</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-[var(--ns-gold-glow)] px-5 py-2 text-sm font-semibold text-[var(--ns-bg-midnight)] hover:bg-[var(--ns-gold-light)]"
          >
            Add
          </button>
        </form>

        <div className="mt-8 overflow-hidden rounded-xl border border-[var(--ns-border-subtle)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--ns-bg-night-sky)] text-[var(--ns-text-inverse)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Person</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Project</th>
                <th className="px-4 py-3 font-semibold">Watched intro</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="bg-[var(--ns-surface-card)]">
              {users.map((u) => {
                const isMe = u.email.toLowerCase() === me.email.toLowerCase();
                return (
                  <tr
                    key={u.email}
                    className={`border-t border-[var(--ns-border-subtle)] ${
                      u.is_active ? "" : "opacity-45"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--ns-text-primary)]">
                        {u.display_name ?? u.email}
                      </div>
                      <div className="text-xs text-[var(--ns-text-secondary)]">
                        {u.email}
                        {!u.is_active && " · removed"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {isMe ? (
                        <span className="text-[var(--ns-text-secondary)]">
                          {u.role} (you)
                        </span>
                      ) : (
                        <form action={setRoleAction} className="flex gap-2">
                          <input type="hidden" name="email" value={u.email} />
                          <input
                            type="hidden"
                            name="role"
                            value={
                              u.role === ROLE_PROJECT_MANAGER
                                ? ROLE_MEMBER
                                : ROLE_PROJECT_MANAGER
                            }
                          />
                          <button
                            type="submit"
                            className="text-[var(--ns-text-primary)] underline-offset-2 hover:underline"
                          >
                            {u.role}
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <form action={setProjectAccessAction}>
                        <input type="hidden" name="email" value={u.email} />
                        <input
                          type="hidden"
                          name="allowed"
                          value={u.has_project_access ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          className={
                            u.has_project_access
                              ? "text-[var(--ns-lluh-teal)] underline-offset-2 hover:underline"
                              : "text-[var(--ns-text-secondary)] underline-offset-2 hover:underline"
                          }
                        >
                          {u.has_project_access ? "Yes" : "No"}
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3 text-[var(--ns-text-secondary)]">
                      {u.welcome_seen_at ? (
                        <form action={resetWelcomeAction}>
                          <input type="hidden" name="email" value={u.email} />
                          <button
                            type="submit"
                            title="Clear this, so they see the intro again"
                            className="underline-offset-2 hover:text-[var(--ns-text-primary)] hover:underline"
                          >
                            {new Date(u.welcome_seen_at).toLocaleDateString()} ·
                            reset
                          </button>
                        </form>
                      ) : (
                        "Not yet"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isMe && u.is_active && (
                        <form action={deactivateUserAction}>
                          <input type="hidden" name="email" value={u.email} />
                          <button
                            type="submit"
                            className="text-[var(--ns-text-secondary)] hover:text-red-600"
                          >
                            Remove
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-[var(--ns-text-secondary)]">
          Removing someone keeps their record, so there is a history of who was
          granted access. Changes take effect the next time they sign in.
        </p>

        <h2 className="ns-display mt-14 text-2xl text-[var(--ns-text-primary)]">
          What the assistant knows
        </h2>
        <p className="mt-2 text-sm text-[var(--ns-text-secondary)]">
          Facts, in-jokes and tone for the Northstar assistant. It works these in
          where they fit. Changes apply to the next message — no redeploy.
        </p>

        <form
          action={addNoteAction}
          className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-5 sm:flex-row"
        >
          <input
            name="body"
            required
            maxLength={500}
            placeholder="e.g. You are not very busy yet, because Ryan, Takira and Dar are slow pokes."
            className={`${input} flex-1`}
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--ns-gold-glow)] px-5 py-2 text-sm font-semibold text-[var(--ns-bg-midnight)] hover:bg-[var(--ns-gold-light)]"
          >
            Add
          </button>
        </form>

        <ul className="mt-4 space-y-2">
          {notes.map((n) => (
            <li
              key={n.id}
              className="flex items-start gap-4 rounded-lg border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] px-4 py-3"
            >
              <span className="flex-1 text-sm text-[var(--ns-text-primary)]">
                {n.body}
              </span>
              <form action={deleteNoteAction}>
                <input type="hidden" name="id" value={n.id} />
                <button
                  type="submit"
                  className="text-sm text-[var(--ns-text-secondary)] hover:text-red-600"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
          {notes.length === 0 && (
            <li className="text-sm text-[var(--ns-text-secondary)]">
              Nothing yet — the assistant will stick to the basics.
            </li>
          )}
        </ul>

        <p className="mt-4 text-xs text-[var(--ns-text-secondary)]">
          Notes shape what the assistant knows and how it jokes. They cannot
          override its refusal to handle patient information.
        </p>

        <h2 className="ns-display mt-14 text-2xl text-[var(--ns-text-primary)]">
          Database
        </h2>
        <p className="mt-2 text-sm text-[var(--ns-text-secondary)]">
          Schema changes ship with the code and are applied from here — nobody
          needs to paste SQL into Neon.
        </p>

        <div className="mt-4 rounded-xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] p-5">
          <ul className="space-y-1 text-sm">
            {migrations.map((m) => (
              <li key={m.name} className="flex items-center justify-between gap-4">
                <code className="text-[var(--ns-text-primary)]">{m.name}</code>
                <span
                  className={
                    m.applied_at
                      ? "text-xs text-[var(--ns-lluh-teal)]"
                      : "text-xs font-medium text-[var(--ns-amber-warm)]"
                  }
                >
                  {m.applied_at
                    ? `applied ${new Date(m.applied_at).toLocaleDateString()}`
                    : "pending"}
                </span>
              </li>
            ))}
          </ul>

          <form action={runMigrationsAction} className="mt-4">
            <button
              type="submit"
              disabled={pending.length === 0}
              className="rounded-lg bg-[var(--ns-bg-night-sky)] px-5 py-2 text-sm font-medium text-[var(--ns-text-inverse)] disabled:opacity-40"
            >
              {pending.length === 0
                ? "Everything applied"
                : `Apply ${pending.length} pending`}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
