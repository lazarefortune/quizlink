/**
 * Converts a quiz rich-text HTML string into a plain text representation, used
 * for previews, accessibility (`alt`), validation, and any context where tags
 * would otherwise leak as literal characters (sidebar, organize mode, etc.).
 *
 * Rules:
 * - `<br>` and block boundaries (`</p>`) become whitespace separators.
 * - Other tags are stripped, their text content is preserved.
 * - HTML entities are decoded for the most common ones.
 * - Consecutive whitespace is collapsed to a single space.
 */
export function richTextToPlainText(input: string): string {
  if (typeof input !== "string" || input.length === 0) {
    return "";
  }

  const withSeparators = input
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/p\s*>/gi, " ")
    .replace(/<p\b[^>]*>/gi, " ");

  const withoutTags = withSeparators.replace(/<[^>]+>/g, "");

  const decoded = decodeBasicEntities(withoutTags);

  return decoded.replace(/\s+/g, " ").trim();
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
};

function decodeBasicEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#x") || entity.startsWith("#X")) {
      const code = parseInt(entity.slice(2), 16);
      return Number.isFinite(code) ? safeFromCodePoint(code) : match;
    }
    if (entity.startsWith("#")) {
      const code = parseInt(entity.slice(1), 10);
      return Number.isFinite(code) ? safeFromCodePoint(code) : match;
    }
    const named = NAMED_ENTITIES[entity.toLowerCase()];
    return named ?? match;
  });
}

function safeFromCodePoint(code: number): string {
  if (code <= 0 || code > 0x10ffff) {
    return "";
  }
  try {
    return String.fromCodePoint(code);
  } catch {
    return "";
  }
}
