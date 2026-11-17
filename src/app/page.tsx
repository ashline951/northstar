import Image from "next/image";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";

export default async function Home() {
  const session = await auth();
  const first = session?.user?.givenName ?? session?.user?.name?.split(" ")[0];

  return (
    <AppShell>
      <div className="mx-auto flex max-w-5xl flex-col items-center px-6 py-16 text-center sm:py-24">
        <h1 className="ns-display text-2xl text-[var(--ns-text-primary)] sm:text-3xl">
          {first ? `Welcome, ${first}` : "Welcome"}
        </h1>

        <Image
          src="/brand/northstar-emblem-dark-bg.png"
          alt="Northstar emblem"
          width={300}
          height={400}
          priority
          className="mt-10 h-auto w-48 rounded-2xl shadow-xl sm:w-60"
        />

        <p className="ns-display mt-10 text-3xl tracking-wide text-[var(--ns-text-primary)] sm:text-5xl">
          Endless Possibilities
        </p>
        <p className="mt-4 text-sm tracking-widest text-[var(--ns-text-secondary)] uppercase">
          Loma Linda University Health
        </p>
      </div>
    </AppShell>
  );
}
