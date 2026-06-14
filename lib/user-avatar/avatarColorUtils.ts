/** DiceBear expects 6-char hex without a leading #. */
export function normalizeDiceBearHexColor(color: string): string {
  const trimmed = color.trim().replace(/^#/, "").toLowerCase();
  return trimmed;
}

export function toCssHexColor(color: string): string {
  return `#${normalizeDiceBearHexColor(color)}`;
}

export function isValidDiceBearHexColor(color: string): boolean {
  return /^[a-f0-9]{6}$/i.test(normalizeDiceBearHexColor(color));
}
