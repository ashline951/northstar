import type { Metadata } from "next";
import Image from "next/image";
import { auth } from "@/auth";
import AppShell from "@/components/AppShell";


export const metadata: Metadata = { title: "Home" };

export default async function Home() {
  const session = await auth();
  const first = session?.user?.givenName ?? session?.user?.name?.split(" ")[0];

  return (
    <AppShell>
      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-10 text-center sm:py-14">
        {/* Right-aligned to the hero's edge: centred above a full-width image
            it read as a stray caption. */}
        <h1 className="ns-display w-full pr-1 text-right text-2xl text-[var(--ns-text-primary)] sm:text-3xl">
          {first ? `Welcome, ${first}` : "Welcome"}
        </h1>

        {/* The hero carries its own Northstar wordmark and the LLUH line, so
            the page does not repeat them underneath. */}
        <Image
          src="/brand/northstar-hero.jpg"
          alt="Northstar — Project Management System, Loma Linda University Health"
          width={2000}
          height={1116}
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="mt-8 h-auto w-full rounded-2xl shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
        />

        <p className="ns-display mt-10 text-3xl tracking-wide text-[var(--ns-text-primary)] sm:text-4xl">
          Endless Possibilities
        </p>
      </div>
    </AppShell>
  );
}
