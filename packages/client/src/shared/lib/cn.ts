/**
 * cn — className utility.
 *
 * Joins truthy string values with spaces. Accepts string | false | null | undefined.
 * Falsy values are skipped so conditional classes compose cleanly.
 *
 * Example:
 *   cn('btn', isActive && 'btn--active', disabled ? 'opacity-50' : null)
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  let out = '';
  for (const c of classes) {
    if (!c) continue;
    if (out) out += ' ';
    out += c;
  }
  return out;
}
