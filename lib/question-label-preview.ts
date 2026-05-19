import { richTextToPlainText } from "@/lib/rich-text/richTextToPlainText";

/**
 * Strips rich-text HTML and truncates for compact builder previews
 * (sidebar / organize mode / mobile lists).
 */
export function buildQuestionLabelPreview(raw: string, maxLength: number): string {
  const plain = richTextToPlainText(raw);
  if (plain.length <= maxLength) {
    return plain;
  }
  return `${plain.slice(0, Math.max(0, maxLength))}…`;
}
