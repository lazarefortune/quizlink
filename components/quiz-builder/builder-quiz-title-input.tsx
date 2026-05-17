"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { textareaFieldClassName } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { QUIZ_NAME_MAX_LENGTH } from "@/lib/quiz-validation";

/** Blurred: grow with content up to this many lines, then scroll inside. */
const COLLAPSED_MAX_LINES = 3;

/** Matches Tailwind max-h-36 (9rem) for focused editing cap. */
const FOCUSED_MAX_REM = 9;

function maxFocusedHeightPx(): number {
  const rootRem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  if (Number.isFinite(rootRem)) {
    return Math.round(FOCUSED_MAX_REM * rootRem);
  }
  return 144;
}

function resolveLineHeightPx(element: HTMLElement): number {
  const lineHeight = getComputedStyle(element).lineHeight;
  if (lineHeight !== "normal") {
    const parsed = parseFloat(lineHeight);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  const fontSize = parseFloat(getComputedStyle(element).fontSize);
  if (Number.isFinite(fontSize)) {
    return Math.round(fontSize * 1.35);
  }
  return 24;
}

export type BuilderQuizTitleInputProps = {
  /** Shown above the field so the role of the input is obvious */
  labelText: string;
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  getNameError: () => string | null;
  maxLength?: number;
  /**
   * `field` — design-system textarea (border, card bg) — mobile quiz name.
   * `inline` — borderless until focus — desktop builder header.
   */
  variant?: "inline" | "field";
};

export function BuilderQuizTitleInput({
  labelText,
  value,
  onChange,
  placeholder,
  getNameError,
  maxLength = QUIZ_NAME_MAX_LENGTH,
  variant = "inline",
}: BuilderQuizTitleInputProps) {
  const isFieldVariant = variant === "field";
  const nameError = getNameError();
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();
  const labelId = useId();

  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }

    const fitHeight = () => {
      const linePx = resolveLineHeightPx(el);
      const maxCollapsed = Math.round(linePx * COLLAPSED_MAX_LINES);
      const cap = isFocused ? maxFocusedHeightPx() : maxCollapsed;
      const minHeightPx = isFieldVariant ? 80 : linePx;
      el.style.height = "auto";
      const scrollHeight = el.scrollHeight;
      el.style.height = `${Math.max(minHeightPx, Math.min(scrollHeight, cap))}px`;
    };

    fitHeight();

    window.addEventListener("resize", fitHeight);
    return () => window.removeEventListener("resize", fitHeight);
  }, [value, isFocused, isFieldVariant]);

  return (
    <div
      className={cn(
        "flex min-w-0 w-full max-w-full flex-col",
        isFieldVariant ? "gap-2" : "flex-1 gap-0.5",
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <label
          id={labelId}
          htmlFor={fieldId}
          className={cn(
            isFieldVariant
              ? "text-base font-medium normal-case leading-snug"
              : "block text-[12px] font-semibold uppercase tracking-wide text-muted-foreground",
          )}
        >
          {labelText}
        </label>
        {isFocused ? (
          <span
            className={cn(
              "shrink-0 tabular-nums text-muted-foreground",
              isFieldVariant ? "text-sm" : "text-[10px]",
            )}
            aria-live="polite"
          >
            {value.length}/{maxLength}
          </span>
        ) : null}
      </div>
      <textarea
        ref={textareaRef}
        id={fieldId}
        aria-labelledby={labelId}
        title={value.trim().length > 0 ? value : undefined}
        rows={isFieldVariant ? 3 : 1}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        spellCheck={false}
        className={cn(
          "w-full min-w-0 max-w-full resize-none break-words scroll-m-0",
          isFieldVariant
            ? cn(
                textareaFieldClassName,
                "font-medium leading-snug",
                isFocused ? "max-h-36 overflow-y-auto" : "overflow-y-hidden",
                nameError &&
                  "border-destructive hover:border-destructive focus:border-destructive focus:ring-destructive/25",
              )
            : cn(
                "min-h-0 bg-transparent text-foreground outline-none transition-[box-shadow,border-color] placeholder:text-muted-foreground/80",
                "rounded-xs border border-transparent px-1 py-2 -mx-1",
                "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
                "text-base font-medium leading-snug lg:text-base lg:font-medium lg:leading-tight lg:tracking-tight",
                isFocused ? "max-h-36 overflow-y-auto" : "overflow-y-hidden",
                nameError &&
                  "border-destructive/80 focus-visible:border-destructive focus-visible:ring-destructive/25",
              ),
        )}
      />
      {nameError ? (
        <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {nameError}
        </p>
      ) : null}
    </div>
  );
}
