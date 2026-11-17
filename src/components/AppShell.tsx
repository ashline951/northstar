import Image from "next/image";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { hasSeenWelcome } from "@/lib/users";
import UserMenu from "./UserMenu";
import WelcomeGate from "./WelcomeGate";

export default async function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user;
  const seenWelcome = user ? await hasSeenWelcome(user.email) : true;

  async function signOutAction() {
    "use server";
    // App-only sign-out. Deliberately does NOT end the Entra session, which
    // would sign the person out of Outlook and Teams too. They land on
    // /signed-out, which does not auto-redirect back into SSO.
    await signOut({ redirectTo: "/signed-out" });
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-black/10 bg-[var(--ns-bg-midnight)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
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

      <main className="flex-1">{children}</main>

      {user && (
        <WelcomeGate firstName={user.givenName ?? null} seen={seenWelcome} />
      )}
    </div>
  );
}
