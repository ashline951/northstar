import Image from "next/image";

/** Public, like /signed-out. Someone who is not on the allow list has a valid
 *  Microsoft identity but no Northstar session, so this page must render
 *  without one. */
export default function NotAuthorizedPage() {
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
        Northstar is not open to you yet
      </h1>
      <p className="max-w-md text-sm text-white/60">
        Your Loma Linda sign-in worked, but your account has not been added to
        Northstar. Access is granted a person at a time while the system is in
        early release.
      </p>
      <p className="max-w-md text-sm text-white/40">
        If you believe you should have access, contact the Northstar project
        team.
      </p>
    </main>
  );
}
