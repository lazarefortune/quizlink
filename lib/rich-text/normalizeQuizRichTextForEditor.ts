import { sanitizeQuizRichText } from "./sanitizeQuizRichText";

const HTML_TAG_PROBE = /<\/?(p|br|strong|em|u|s|a)\b[^>]*>/i;

/**
 * Prepares a value coming from storage (or legacy plain text) for the Tiptap editor.
 *
 * - If the string already contains whitelisted HTML tags, run it through the
 *   sanitizer so the editor never sees unsafe markup.
 * - Otherwise, treat it as plain text: escape HTML special characters and wrap
 *   it in a `<p>` so the editor has a valid document. Plain newlines become
 *   `<br>`s within the same paragraph.
 */
export function normalizeQuizRichTextForEditor(input: string | null | undefined): string {
  if (typeof input !== "string" || input.length === 0) {
    return "";
  }

  if (HTML_TAG_PROBE.test(input)) {
    return sanitizeQuizRichText(input);
  }

  const escaped = escapePlainText(input);
  const withBreaks = escaped.replace(/\n/g, "<br>");
  return `<p>${withBreaks}</p>`;
}

function escapePlainText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
