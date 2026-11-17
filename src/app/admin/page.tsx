import { auth } from "@/auth";
import AppShell from "@/components/AppShell";
import {
  ROLE_MEMBER,
  ROLE_PROJECT_MANAGER,
  getActiveUser,
  listUsers,
} from "@/lib/users";
import { addUserAction, deactivateUserAction, setRoleAction } from "./actions";

export default async function AdminPage() {
  const session = await auth();
  const me = await getActiveUser(session?.user?.email);

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
                    <td className="px-4 py-3 text-[var(--ns-text-secondary)]">
                      {u.welcome_seen_at
                        ? new Date(u.welcome_seen_at).toLocaleDateString()
                        : "Not yet"}
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
      </div>
    </AppShell>
  );
}
