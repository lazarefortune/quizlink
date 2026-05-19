import DOMPurify from "dompurify";

import {
  QUIZ_RICH_TEXT_ALLOWED_ATTRS,
  QUIZ_RICH_TEXT_ALLOWED_TAGS,
  QUIZ_RICH_TEXT_ALLOWED_TAG_SET,
  QUIZ_RICH_TEXT_VOID_TAGS,
} from "./quizRichTextWhitelist";

/**
 * Sanitizes a rich-text HTML string for `question.label`.
 *
 * Defense in depth:
 * - In the browser, DOMPurify enforces the whitelist with a real parser.
 * - On the server (or anywhere `window` is undefined), a string-based
 *   whitelist sanitizer applies the same policy without needing jsdom.
 *
 * V1 policy: only `<p>`, `<br>`, `<strong>`, `<em>`, `<u>`, `<s>` survive.
 * Any other tag (incl. `<a>`, `<img>`, scripts, iframes, etc.) is removed while
 * preserving the inner text content.
 */
export function sanitizeQuizRichText(input: string): string {
  if (typeof input !== "string" || input.length === 0) {
    return "";
  }

  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return sanitizeWithDomPurify(input);
  }

  return sanitizeWithStringWhitelist(input);
}

function sanitizeWithDomPurify(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [...QUIZ_RICH_TEXT_ALLOWED_TAGS],
    ALLOWED_ATTR: [...QUIZ_RICH_TEXT_ALLOWED_ATTRS],
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ["style", "class", "id", "target", "rel", "href"],
    KEEP_CONTENT: true,
    USE_PROFILES: { html: true },
  });
}

/**
 * Server-safe whitelist sanitizer. Uses a deliberately small set of regex passes
 * because Tiptap's output for our V1 only contains a handful of well-formed tags.
 * Unknown tags are stripped; their text content is preserved.
 */
function sanitizeWithStringWhitelist(input: string): string {
  const withoutComments = input.replace(/<!--[\s\S]*?-->/g, "");
  const withoutBlocks = withoutComments.replace(
    /<(script|style|iframe|object|embed|svg|math|template|noscript)\b[\s\S]*?<\/\1>/gi,
    "",
  );

  return withoutBlocks.replace(
    /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (_match, slash: string, rawTagName: string) => {
      const tag = rawTagName.toLowerCase();
      if (!QUIZ_RICH_TEXT_ALLOWED_TAG_SET.has(tag)) {
        return "";
      }
      if (slash === "/") {
        if (QUIZ_RICH_TEXT_VOID_TAGS.has(tag)) {
          return "";
        }
        return `</${tag}>`;
      }
      return `<${tag}>`;
    },
  );
}
