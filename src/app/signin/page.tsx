"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";

/**
 * Entra is the only provider, so there is nothing to choose: bounce straight
 * to Microsoft. On a corporate device with a live session this is invisible -
 * the person lands back signed in.
 *
 * Public by necessity: it is where unauthenticated visitors are sent.
 */
export default function SignInPage() {
  useEffect(() => {
    void signIn("microsoft-entra-id", { callbackUrl: "/" });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--ns-bg-midnight)] px-6 text-center">
      <span
        aria-hidden="true"
        className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[var(--ns-gold-glow)]"
      />
      <p className="text-sm text-white/60">Signing you in with Microsoft…</p>
      <noscript>
        <p className="text-sm text-white/60">
          JavaScript is required to sign in.
        </p>
      </noscript>
    </main>
  );
}
