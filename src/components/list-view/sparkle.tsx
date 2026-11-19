/**
 * The AI sparkle. Section 6 of the list view standard: gold in every LLUH
 * app, whatever that app's brand colour is, so people recognise it
 * instantly. Inline SVG rather than an icon font so the gradient survives.
 */
export default function Sparkle({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="ns-sparkle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff6d6" />
          <stop offset="45%" stopColor="#f2b705" />
          <stop offset="100%" stopColor="#e0a100" />
        </linearGradient>
      </defs>
      <path
        d="M12 2.5l1.9 6.1 6.1 1.9-6.1 1.9L12 18.5l-1.9-6.1L4 10.5l6.1-1.9z"
        fill="url(#ns-sparkle)"
        stroke="#b7791f"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <path d="M18.5 15.5l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8z" fill="url(#ns-sparkle)" />
    </svg>
  );
}
