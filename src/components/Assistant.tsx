"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const GREETING =
  "Hello. I can answer questions about Northstar - how access works, what it does today, what is coming next.";

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      if (!res.ok || !res.body) {
        setMessages([
          ...next,
          {
            role: "assistant",
            content:
              res.status === 503
                ? "The assistant is not switched on yet."
                : "Sorry - something went wrong.",
          },
        ]);
        return;
      }

      // Append an empty assistant turn, then fill it as the stream arrives.
      setMessages([...next, { role: "assistant", content: "" }]);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages([...next, { role: "assistant", content: acc }]);
      }
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Sorry - something went wrong." },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open the Northstar assistant"
        className="fixed right-5 bottom-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--ns-bg-midnight)] shadow-xl ring-1 ring-[var(--ns-gold-glow)]/40 transition hover:ring-[var(--ns-gold-glow)]"
      >
        <Image src="/brand/northstar-icon.svg" alt="" width={30} height={30} />
      </button>
    );
  }

  return (
    <div className="fixed right-5 bottom-5 z-40 flex h-[32rem] w-[min(23rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-[var(--ns-border-subtle)] bg-[var(--ns-surface-card)] shadow-2xl">
      <header className="flex items-center gap-3 bg-[var(--ns-bg-midnight)] px-4 py-3">
        <Image src="/brand/northstar-icon.svg" alt="" width={26} height={26} />
        <div className="flex-1">
          <p className="ns-display text-sm text-[var(--ns-gold-light)]">
            Northstar Assistant
          </p>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close the assistant"
          className="text-white/50 hover:text-white"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        <p className="text-sm text-[var(--ns-text-secondary)]">{GREETING}</p>
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "ml-auto max-w-[85%] rounded-xl rounded-br-sm bg-[var(--ns-bg-night-sky)] px-3 py-2 text-sm text-[var(--ns-text-inverse)]"
                : "max-w-[90%] rounded-xl rounded-bl-sm bg-black/5 px-3 py-2 text-sm whitespace-pre-wrap text-[var(--ns-text-primary)] dark:bg-white/10"
            }
          >
            {m.content || (busy ? "…" : "")}
          </div>
        ))}
      </div>

      <form onSubmit={send} className="border-t border-[var(--ns-border-subtle)] p-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Northstar…"
            disabled={busy}
            className="flex-1 rounded-lg border border-[var(--ns-border-subtle)] bg-transparent px-3 py-2 text-sm text-[var(--ns-text-primary)] outline-none focus:border-[var(--ns-gold-glow)]"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="rounded-lg bg-[var(--ns-gold-glow)] px-4 py-2 text-sm font-semibold text-[var(--ns-bg-midnight)] disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <p className="mt-2 text-center text-[11px] text-[var(--ns-text-secondary)]">
          Synthetic data only — do not enter patient information.
        </p>
      </form>
    </div>
  );
}
