"use client";

import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import {
  formatQuizTimeRemainingAriaLabel,
  formatQuizTimeRemainingHuman,
} from "@/lib/quiz/formatQuizTimeRemainingHuman";
import { resolveQuizTimerInfo, type QuizTimerState } from "@/lib/quiz/quizTimerState";

export type QuizQuestionCircularTimerProps = {
  timeLeftSeconds: number | null | undefined;
  totalSeconds: number | null | undefined;
  locale?: Locale;
  size?: "sm" | "md";
  /** When false, only the progress ring is shown (seconds live in an external label). */
  showCenterSeconds?: boolean;
  className?: string;
};

type StateClasses = {
  ring: string;
  text: string;
};

const STATE_CLASSES: Record<QuizTimerState, StateClasses> = {
  normal: {
    ring: "text-blue",
    text: "text-foreground",
  },
  warning: {
    ring: "text-amber-500",
    text: "text-amber-600 dark:text-amber-400",
  },
  danger: {
    ring: "text-destructive",
    text: "text-destructive",
  },
};

const SIZE_CONFIG = {
  sm: {
    box: "h-11 w-11",
    text: "text-[11px]",
  },
  md: {
    box: "h-14 w-14",
    text: "text-sm",
  },
} as const;

// viewBox is square 36x36; radius/stroke chosen so the ring stays inside the box.
const SVG_RADIUS = 15.5;
const SVG_STROKE_WIDTH = 3.2;
const SVG_CIRCUMFERENCE = 2 * Math.PI * SVG_RADIUS;

export function QuizQuestionCircularTimer({
  timeLeftSeconds,
  totalSeconds,
  locale = "fr",
  size = "sm",
  showCenterSeconds = true,
  className,
}: QuizQuestionCircularTimerProps) {
  const info = resolveQuizTimerInfo(timeLeftSeconds, totalSeconds);
  if (!info) return null;

  const safeSeconds = Math.max(0, Math.floor(timeLeftSeconds ?? 0));
  const stateClasses = STATE_CLASSES[info.state];
  const sizeConfig = SIZE_CONFIG[size];
  const dashOffset = SVG_CIRCUMFERENCE * (1 - info.percent / 100);
  const ariaLabel = formatQuizTimeRemainingAriaLabel(safeSeconds, locale);
  const displayLabel = formatQuizTimeRemainingHuman(safeSeconds, locale);
  const displayTextClass =
    displayLabel.length > 4 ? "text-[10px]" : sizeConfig.text;

  return (
    <div
      role="timer"
      aria-label={ariaLabel}
      aria-live="polite"
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full",
        sizeConfig.box,
        info.state === "danger" && "motion-safe:animate-pulse",
        className,
      )}
    >
      <svg
        className="absolute inset-0 h-full w-full -rotate-90"
        viewBox="0 0 36 36"
        aria-hidden="true"
      >
        <circle
          cx="18"
          cy="18"
          r={SVG_RADIUS}
          fill="none"
          className="stroke-muted"
          strokeWidth={SVG_STROKE_WIDTH}
        />
        <circle
          cx="18"
          cy="18"
          r={SVG_RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={SVG_STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={SVG_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className={cn(
            "transition-[stroke-dashoffset,stroke] duration-700 ease-linear motion-reduce:transition-none",
            stateClasses.ring,
          )}
        />
      </svg>
      {showCenterSeconds ? (
        <span
          className={cn(
            "relative max-w-[2.75rem] text-center font-semibold tabular-nums leading-none",
            displayTextClass,
            stateClasses.text,
          )}
        >
          {displayLabel}
        </span>
      ) : null}
    </div>
  );
}
