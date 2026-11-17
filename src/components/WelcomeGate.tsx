"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { hasSeenWelcome, markWelcomeSeen } from "@/lib/welcome";

const VIDEO_URL = process.env.NEXT_PUBLIC_WELCOME_VIDEO_URL ?? "";

export default function WelcomeGate({
  email,
  firstName,
}: {
  email?: string | null;
  firstName?: string | null;
}) {
  // Start hidden and decide on the client: localStorage is not available
  // during server rendering, and we must not flash the overlay at people
  // who have already seen it.
  const [show, setShow] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!hasSeenWelcome(email)) setShow(true);
  }, [email]);

  // "Watch the Northstar video" in the user menu.
  useEffect(() => {
    const onReplay = () => {
      setStarted(false);
      setFinished(false);
      setShow(true);
    };
    window.addEventListener("ns:replay-welcome", onReplay);
    return () => window.removeEventListener("ns:replay-welcome", onReplay);
  }, []);

  const enter = useCallback(() => {
    markWelcomeSeen(email);
    setShow(false);
  }, [email]);

  // Lock background scroll while the overlay is up.
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  if (!show) return null;

  function play() {
    setStarted(true);
    // Browsers block audio without a user gesture, which is why playback
    // starts from this click rather than autoplaying on load.
    videoRef.current?.play().catch(() => setFinished(true));
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--ns-bg-midnight)] px-6 py-10">
      <h1 className="ns-display mb-2 text-center text-3xl text-[var(--ns-gold-light)] sm:text-4xl">
        {firstName ? `Welcome, ${firstName}` : "Welcome"}
      </h1>
      <p className="mb-8 text-center text-sm tracking-wide text-[var(--ns-text-inverse)]/70">
        A short introduction to Northstar
      </p>

      <div className="relative w-full max-w-3xl overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-white/10">
        {VIDEO_URL ? (
          <video
            ref={videoRef}
            src={VIDEO_URL}
            preload="metadata"
            playsInline
            controls={started}
            onEnded={() => setFinished(true)}
            className="aspect-video w-full"
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center p-8 text-center text-sm text-white/60">
            The welcome video has not been added yet.
          </div>
        )}

        {VIDEO_URL && !started && (
          <button
            onClick={play}
            aria-label="Play the welcome video"
            className="absolute inset-0 flex items-center justify-center bg-black/40 transition hover:bg-black/30"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--ns-gold-glow)] shadow-lg">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#0B132B" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </button>
        )}
      </div>

      <div className="mt-8 h-12">
        {finished || !VIDEO_URL ? (
          <button
            onClick={enter}
            className="rounded-lg bg-[var(--ns-gold-glow)] px-8 py-3 font-semibold text-[var(--ns-bg-midnight)] shadow-lg transition hover:bg-[var(--ns-gold-light)]"
          >
            Enter Northstar
          </button>
        ) : (
          <p className="text-xs text-[var(--ns-text-inverse)]/40">
            {started ? "" : "Press play to begin"}
          </p>
        )}
      </div>
    </div>
  );
}
