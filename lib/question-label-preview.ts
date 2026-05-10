/**
 * Strips basic HTML tags and truncates for compact builder previews (organize mode).
 */
export function buildQuestionLabelPreview(raw: string, maxLength: number): string {
  const plain = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (plain.length <= maxLength) {
    return plain;
  }
  return `${plain.slice(0, Math.max(0, maxLength))}…`;
}
