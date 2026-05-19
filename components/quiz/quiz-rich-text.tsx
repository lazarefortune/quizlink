"use client";

import { useMemo } from "react";

import { sanitizeQuizRichText } from "@/lib/rich-text/sanitizeQuizRichText";
import { cn } from "@/lib/utils";

type QuizRichTextProps = {
  html: string;
  /**
   * Element used to wrap the rendered HTML. Defaults to `div`.
   * Use `span` when the rich text is nested inside another text element
   * (e.g. a `CardTitle` that already mixes labels and rich content).
   */
  as?: "div" | "span";
  className?: string;
};

/**
 * Renders quiz rich text (sanitized HTML) safely.
 *
 * Always re-runs the sanitizer at render time so unsafe markup cannot reach
 * the DOM even if it slipped through earlier layers (defense in depth).
 */
export function QuizRichText({ html, as = "div", className }: QuizRichTextProps) {
  const safeHtml = useMemo(() => sanitizeQuizRichText(html ?? ""), [html]);

  const baseClassName =
    "quiz-rich-text break-words [&_p:not(:last-child)]:mb-2";

  if (as === "span") {
    return (
      <span
        className={cn(baseClassName, className)}
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    );
  }

  return (
    <div
      className={cn(baseClassName, className)}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
