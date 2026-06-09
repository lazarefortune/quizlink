/** Escapes a string for use inside a RegExp (e.g. labels containing "+"). */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
