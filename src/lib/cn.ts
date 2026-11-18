/** Joins class names, dropping anything falsy. Keeps conditional classes
 *  readable without pulling in a dependency for it. */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
