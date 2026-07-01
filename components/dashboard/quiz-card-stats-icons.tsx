import type { SVGProps } from "react";

import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AnalyticsUpIcon, FileQuestionMarkIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

type QuizCardStatIconProps = {
  className?: string;
};

function QuizCardStatSvg({
  className,
  children,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("h-5 w-5 shrink-0 sm:h-6 sm:w-6", className)}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function QuizCardQuestionCountIcon({ className }: QuizCardStatIconProps) {
  return (
    <QuizCardStatSvg className={className}>
      <g transform="translate(50 50)">
        <rect
          x="-22"
          y="-28"
          width="44"
          height="56"
          rx="6"
          fill="#FFFFFF"
          stroke="#1CB0F6"
          strokeWidth="5"
        />
        <rect x="-14" y="-16" width="28" height="7" rx="2" fill="#1CB0F6" />
        <rect x="-14" y="-4" width="20" height="5" rx="2" fill="#CE82FF" />
        <rect x="-14" y="6" width="24" height="5" rx="2" fill="#CE82FF" />
        <circle cx="12" cy="20" r="9" fill="#FFC800" stroke="#CD7900" strokeWidth="4" />
        <path
          d="M12 15 L12 21 M12 23 L12 24"
          stroke="#CD7900"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
    </QuizCardStatSvg>
  );
}

export function QuizCardResultCountIcon({ className }: QuizCardStatIconProps) {
  return (
    <QuizCardStatSvg className={className}>
      <g transform="translate(50 50)">
        <rect
          x="-26"
          y="-8"
          width="14"
          height="36"
          rx="4"
          fill="#FF4B4B"
          stroke="#A82828"
          strokeWidth="5"
        />
        <rect
          x="-7"
          y="-22"
          width="14"
          height="50"
          rx="4"
          fill="#58CC02"
          stroke="#2D6B01"
          strokeWidth="5"
        />
        <rect
          x="12"
          y="-2"
          width="14"
          height="30"
          rx="4"
          fill="#1CB0F6"
          stroke="#0E5C82"
          strokeWidth="5"
        />
      </g>
    </QuizCardStatSvg>
  );
}

type QuizCardStatsProps = {
  locale: Locale;
  questionCount: number;
  attemptCount: number;
  showResults: boolean;
  className?: string;
};

function getResultLabel(locale: Locale, count: number): string {
  return count <= 1
    ? t(locale, "dashboard.resultSingular")
    : t(locale, "dashboard.resultsPlural");
}

export function QuizCardStats({
  locale,
  questionCount,
  attemptCount,
  showResults,
  className,
}: QuizCardStatsProps) {
  return (
    <div className={cn("flex items-center gap-4 text-base text-muted-foreground", className)}>
      <span className="inline-flex items-center gap-1">
        <HugeiconsIcon icon={FileQuestionMarkIcon} size={15} strokeWidth={2} />
        {questionCount}{" "}
        {questionCount === 1
          ? t(locale, "dashboard.question")
          : t(locale, "dashboard.questions")}
      </span>
      {showResults ? (
        <span className="inline-flex items-center gap-1">
          <HugeiconsIcon icon={AnalyticsUpIcon} size={15} strokeWidth={2} />
          {attemptCount} {getResultLabel(locale, attemptCount)}
        </span>
      ) : null}
    </div>
  );
}
