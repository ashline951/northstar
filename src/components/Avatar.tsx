/* eslint-disable @next/next/no-img-element */

function initials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  }
  return (email ?? "?").slice(0, 2).toUpperCase();
}

export default function Avatar({
  src,
  name,
  email,
  size = 36,
}: {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  size?: number;
}) {
  // Graph returns no photo for plenty of accounts; initials are a normal
  // path, not an error state.
  if (src) {
    return (
      <img
        alt={name ?? "Profile photo"}
        src={src}
        width={size}
        height={size}
        className="rounded-full object-cover ring-1 ring-white/25 shrink-0"
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--ns-bg-rich-navy)] font-semibold text-[var(--ns-text-inverse)] ring-1 ring-white/25"
    >
      {initials(name, email)}
    </span>
  );
}
