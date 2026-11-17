import Image from "next/image";
import Link from "next/link";

/** Deliberately outside the auth middleware. With SSO on, anything that
 *  auto-redirects here would sign the person straight back in, so leaving
 *  requires an explicit click. */
export default function SignedOutPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--ns-bg-midnight)] px-6 text-center">
      <Image
        src="/brand/northstar-icon.svg"
        alt=""
        width={56}
        height={56}
        className="h-14 w-14"
      />
      <h1 className="ns-display text-2xl text-[var(--ns-gold-light)]">
        You have signed out of Northstar
      </h1>
      <p className="max-w-md text-sm text-white/60">
        You are still signed in to Microsoft, so your other Loma Linda apps are
        unaffected.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[var(--ns-gold-glow)] px-6 py-3 font-semibold text-[var(--ns-bg-midnight)] transition hover:bg-[var(--ns-gold-light)]"
      >
        Sign back in
      </Link>
    </main>
  );
}
