"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  CheckCheck,
  CircleCheck,
  CopyCheck,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/quiz-builder";

type BuilderQuestionNavigatorSortableRowProps = {
  question: Question;
  index: number;
  isActive: boolean;
  typeLabel: string;
  displayPreview: string;
  dragHandleAriaLabel: string;
  onNavigate: () => void;
  /** When true, render a discreet error dot/border on the row. */
  hasError?: boolean;
  errorIndicatorAriaLabel?: string;
};

export function BuilderQuestionNavigatorSortableRow({
  question,
  index,
  isActive,
  typeLabel,
  displayPreview,
  dragHandleAriaLabel,
  onNavigate,
  hasError = false,
  errorIndicatorAriaLabel,
}: BuilderQuestionNavigatorSortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: question.id,
    animateLayoutChanges: () => false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: undefined,
    opacity: isDragging ? 0.45 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-has-error={hasError ? "true" : undefined}
      className={cn(
        "flex w-full items-stretch gap-0 rounded-sm border text-foreground",
        "transition-[box-shadow,border-color,background-color] duration-150 ease-out",
        isDragging &&
          "z-10 border-blue/55 bg-blue/12 shadow-md ring-2 ring-blue/40 ring-offset-2 ring-offset-background dark:border-blue/45 dark:bg-blue/15",
        !isDragging &&
          isActive && [
            "border-blue/50 bg-blue/10 shadow-sm",
            "hover:border-blue/60 hover:bg-blue/15",
          ],
        !isDragging &&
          !isActive && [
            "border-border/50 bg-card/80 shadow-sm",
            "hover:border-border hover:bg-muted/40 dark:border-border/60 dark:bg-card/55",
          ],
        !isDragging &&
          hasError &&
          "border-destructive/55 bg-destructive/[0.06] hover:border-destructive/65 hover:bg-destructive/10 dark:border-destructive/45",
      )}
    >
      <button
        type="button"
        className={cn(
          "flex shrink-0 cursor-grab touch-none items-center rounded-l-md px-1 py-1.5 text-muted-foreground transition-colors",
          "hover:bg-muted/60 hover:text-foreground active:cursor-grabbing",
        )}
        aria-label={dragHandleAriaLabel}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        data-question-nav-item={question.id}
        onClick={onNavigate}
        className={cn(
          "flex min-w-0 flex-1 flex-col gap-0.5 rounded-r-md border border-transparent py-2 pr-2 text-left text-sm transition-colors",
          "hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "shrink-0 text-xs font-semibold tabular-nums text-muted-foreground",
              hasError && "text-destructive",
            )}
          >
            {index + 1}.
          </span>
          <span
            className={cn(
              "min-w-0 flex-1 truncate font-medium leading-snug",
              hasError && "text-destructive",
            )}
          >
            {displayPreview}
          </span>
          {hasError ? (
            <AlertCircle
              className="h-3.5 w-3.5 shrink-0 text-destructive"
              aria-label={errorIndicatorAriaLabel}
              role="img"
            />
          ) : null}
        </div>
        <div className="flex items-center gap-1">
            {/* icon for type */}
            {question.type === "MULTIPLE_CHOICE" && <CircleCheck className="h-4 w-4 text-muted-foreground" />}
            {question.type === "CHECKBOX" && <CopyCheck className="h-4 w-4 text-muted-foreground" />}
            {question.type === "TRUE_FALSE" && <CheckCheck className="h-4 w-4 text-muted-foreground" />}
          <span className="text-[12px] font-medium tracking-wide text-muted-foreground">
            {typeLabel}
          </span>
        </div>
      </button>
    </div>
  );
}
