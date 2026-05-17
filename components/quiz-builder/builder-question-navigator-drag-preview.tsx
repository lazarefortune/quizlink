"use client";

import { CheckCheck, CircleCheck, CopyCheck, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/quiz-builder";

type BuilderQuestionNavigatorDragPreviewProps = {
  question: Question;
  index: number;
  typeLabel: string;
  displayPreview: string;
  dragHandleAriaLabel: string;
  className?: string;
};

/** Static row clone for DragOverlay (not a sortable item). */
export function BuilderQuestionNavigatorDragPreview({
  question,
  index,
  typeLabel,
  displayPreview,
  dragHandleAriaLabel,
  className,
}: BuilderQuestionNavigatorDragPreviewProps) {
  return (
    <div
      className={cn(
        "flex w-full max-w-full cursor-grabbing items-stretch gap-0 rounded-md border border-blue/45 bg-card/95 text-foreground shadow-2xl shadow-black/20 dark:border-blue/40 dark:bg-card dark:shadow-black/45",
        className,
      )}
    >
      <div
        className="flex shrink-0 cursor-grabbing items-center rounded-l-md px-1 py-1.5 text-muted-foreground"
        aria-hidden
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>
      <div
        className="flex min-w-0 flex-1 flex-col gap-0.5 rounded-r-md py-2 pr-2 text-left text-sm"
        aria-label={dragHandleAriaLabel}
      >
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
            {index + 1}.
          </span>
          <span className="min-w-0 flex-1 truncate font-medium leading-snug">{displayPreview}</span>
        </div>
        <div className="flex items-center gap-1">
          {question.type === "MULTIPLE_CHOICE" && (
            <CircleCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          {question.type === "CHECKBOX" && (
            <CopyCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          {question.type === "TRUE_FALSE" && (
            <CheckCheck className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <span className="text-[12px] font-medium tracking-wide text-muted-foreground">{typeLabel}</span>
        </div>
      </div>
    </div>
  );
}
