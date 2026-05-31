/**
 * Returns the first 8-char hex window of the UUID that contains both
 * letters (a-f) and digits (0-9), ensuring an alphanumeric pattern.
 * UUID v4 always has such a window — the fallback is unreachable in practice.
 */
export function pickAnonSegment(id: string): string {
  const hex = id.replace(/-/g, "");
  for (let i = 0; i <= hex.length - 8; i++) {
    const s = hex.slice(i, i + 8);
    if (/[a-f]/.test(s) && /[0-9]/.test(s)) return s;
  }
  return hex.slice(0, 8);
}
