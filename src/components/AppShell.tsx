import Image from "next/image";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getActiveUser } from "@/lib/users";
import UserMenu from "./UserMenu";
import WelcomeGate from "./WelcomeGate";
import Assistant from "./Assistant";
import SideNav from "./nav/side-nav";
import MobileNav from "./nav/mobile-nav";

export default async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;
  // One lookup serves both the welcome gate and the Project link, and means
  // neither depends on a stale JWT claim.
  const record = user ? await getActiveUser(user.email) : null;
  const seenWelcome = Boolean(record?.welcome_seen_at);
  const canSeeProject = Boolean(record?.has_project_access);

  async function signOutAction() {
    "use server";
    // App-only sign-out. Deliberately does NOT end the Entra session, which
    // would sign the person out of Outlook and Teams too. They land on
    // /signed-out, which does not auto-redirect back into SSO.
    await signOut({ redirectTo: "/signed-out" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--ns-bg-midnight)] shadow-sm">
        <div className="flex h-16 w-full items-center justify-between gap-4 px-5 sm:px-8">
          {canSeeProject && (
            <MobileNav showAdmin={record?.role === "Project Manager"} />
          )}

          <Link href="/" className="flex items-center gap-3" aria-label="Northstar home">
            <Image
              src="/brand/northstar-icon.svg"
              alt=""
              width={36}
              height={36}
              priority
              className="h-9 w-9"
            />
            <span className="ns-display text-xl tracking-wide text-[var(--ns-gold-light)] sm:text-2xl">
              Northstar
            </span>
          </Link>

          {/* Spacer pushes the project link and the user menu to the right. */}
          <div className="flex-1" />

          {canSeeProject && (
            <Link
              href="/project"
              className="rounded-lg border border-[var(--ns-gold-glow)]/40 px-3 py-1.5 text-sm font-medium text-[var(--ns-gold-light)] transition hover:border-[var(--ns-gold-glow)] hover:bg-[var(--ns-gold-glow)]/10"
            >
              Northstar Project
            </Link>
          )}

          {user && (
            <UserMenu
              name={user.name}
              email={user.email}
              image={user.image}
              jobTitle={user.jobTitle}
              role={user.role}
              signOutAction={signOutAction}
            />
          )}
        </div>
      </header>

      {/* The left navigation is part of the shell for people on the project;
          everyone else gets the plain single-column layout. */}
      {canSeeProject ? (
        <div className="flex flex-1">
          {/* 240px open, 56px collapsed, width-only transition. Hidden below
              1024px, where the same navigator opens as a drawer instead. */}
          <aside className="hidden w-60 shrink-0 border-r border-[var(--ns-border-subtle)] bg-[var(--ns-nav-bg)] transition-[width] duration-200 nav-closed:w-14 lg:block">
            <SideNav showAdmin={record?.role === "Project Manager"} />
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      ) : (
        <main className="flex-1">{children}</main>
      )}

      {user && (
        <>
          <Assistant />
          <WelcomeGate firstName={user.givenName ?? null} seen={seenWelcome} />
        </>
      )}
    </div>
  );
}
