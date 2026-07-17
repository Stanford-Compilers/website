/** Pure helpers for ordering and displaying people. */

export interface PersonLike {
  name: string;
  order: number;
}

export function surname(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1] || name;
}

/** First (given) name token, used to sort the directory alphabetically by first name. */
export function firstName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts[0] || name;
}

/** Initials for the monogram placeholder, max two letters. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Deterministic monogram hue from a name, so placeholders vary but are stable.
 * Returns an integer degree 0–359.
 */
export function monogramHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return hash;
}

/** Sort within a category: explicit order first, then alphabetical by first name. */
export function sortPeople<T extends PersonLike>(people: readonly T[]): T[] {
  return [...people].sort((a, b) => {
    if (a.order !== b.order) return a.order - b.order;
    return firstName(a.name).localeCompare(firstName(b.name));
  });
}
