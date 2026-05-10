"use client";

import { useState } from "react";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp, GripVertical, MoreHorizontal, Pencil } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { buildQuestionLabelPreview } from "@/lib/question-label-preview";
import type { Question, QuestionType } from "@/types/quiz-builder";

type BuilderOrganizeQuestionsListProps = {
  locale: Locale;
  questions: Question[];
  onReorder: (nextQuestions: Question[]) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDeleteQuestion: (questionId: string) => void;
  onEditQuestion: (questionId: string) => void;
};

const PREVIEW_MAX_LEN = 88;

function questionTypeLabel(locale: Locale, type: QuestionType): string {
  switch (type) {
    case "MULTIPLE_CHOICE":
      return t(locale, "builder.questionTypeMultipleChoice");
    case "CHECKBOX":
      return t(locale, "builder.questionTypeCheckbox");
    case "TRUE_FALSE":
      return t(locale, "builder.questionTypeTrueFalse");
    default:
      return type;
  }
}

type SortableOrganizeRowProps = {
  locale: Locale;
  question: Question;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onEdit: () => void;
};

function SortableOrganizeRow({
  locale,
  question,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
}: SortableOrganizeRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const preview = buildQuestionLabelPreview(question.label || "", PREVIEW_MAX_LEN);
  const optionCount = question.options.length;
  const displayPreview = preview || t(locale, "builder.organizeEmptyQuestionPreview");
  const imageSrc = question.image?.trim() ?? "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex gap-2 rounded-xl border border-border/50 bg-card/90 py-2 pl-2 pr-1.5 shadow-sm sm:gap-3 sm:py-2.5 sm:pl-3 sm:pr-2",
        "transition-[box-shadow,border-color,background-color,transform] duration-200",
        "hover:border-border hover:bg-muted/25 hover:shadow-md",
        isDragging && "z-10 scale-[1.01] shadow-lg ring-2 ring-blue/30 ring-offset-2 ring-offset-background",
      )}
    >
      <div className="flex shrink-0 flex-col items-center gap-0.5 sm:flex-row sm:items-center sm:gap-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label={t(locale, "builder.organizeDragHandleAria")}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="flex flex-col gap-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onMoveUp}
            disabled={index === 0}
            aria-label={t(locale, "builder.moveQuestionUp")}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onMoveDown}
            disabled={index === total - 1}
            aria-label={t(locale, "builder.moveQuestionDown")}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <span
          className="flex h-7 min-w-7 items-center justify-center rounded-full bg-muted/90 px-1.5 text-xs font-semibold tabular-nums text-muted-foreground sm:h-8 sm:min-w-8"
          aria-hidden
        >
          {index + 1}
        </span>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="min-w-0 flex-1 rounded-lg px-1.5 py-0.5 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="max-w-full truncate text-xs font-medium text-muted-foreground">
            {questionTypeLabel(locale, question.type)}
          </span>
          <span className="text-[11px] tabular-nums text-muted-foreground/90 sm:text-xs">
            {t(locale, "builder.organizeOptionCount", { count: optionCount })}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-foreground">{displayPreview}</p>
        {imageSrc !== "" ? (
          <div
            className="relative mt-2 h-7 w-[3.25rem] shrink-0 overflow-hidden rounded border border-border/50 bg-muted/50"
            aria-hidden
          >
            <Image
              src={imageSrc}
              alt=""
              fill
              className="object-cover"
              sizes="52px"
              unoptimized
            />
          </div>
        ) : null}
      </button>

      <div className="flex shrink-0 flex-col items-center gap-0.5 self-start sm:flex-row sm:self-center">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground opacity-80 transition-opacity hover:bg-muted hover:text-foreground hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label={t(locale, "builder.editThisQuestion")}
          title={t(locale, "builder.editThisQuestion")}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={t(locale, "builder.questionActionsMenu")}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-base">
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={onDelete}
            >
              {t(locale, "common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function BuilderOrganizeQuestionsList({
  locale,
  questions,
  onReorder,
  onMoveUp,
  onMoveDown,
  onDeleteQuestion,
  onEditQuestion,
}: BuilderOrganizeQuestionsListProps) {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = questions.findIndex((q) => q.id === active.id);
    const newIndex = questions.findIndex((q) => q.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    onReorder(arrayMove(questions, oldIndex, newIndex));
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
      onDeleteQuestion(deleteTargetId);
    }
    setDeleteTargetId(null);
  };

  return (
    <>
      <div className="mb-5 space-y-1.5 border-b border-border/40 pb-4">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t(locale, "builder.organizeQuestionsTitle")}
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {t(locale, "builder.organizeQuestionsDragHint")}
        </p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
          <ul className="flex flex-col gap-1.5 sm:gap-2" role="list">
            {questions.map((question, index) => (
              <li key={question.id} role="listitem">
                <SortableOrganizeRow
                  locale={locale}
                  question={question}
                  index={index}
                  total={questions.length}
                  onMoveUp={() => onMoveUp(index)}
                  onMoveDown={() => onMoveDown(index)}
                  onEdit={() => onEditQuestion(question.id)}
                  onDelete={() => setDeleteTargetId(question.id)}
                />
              </li>
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <AlertDialog open={deleteTargetId !== null} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent className="text-base">
          <AlertDialogHeader>
            <AlertDialogTitle>{t(locale, "builder.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t(locale, "builder.deleteConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-base">{t(locale, "common.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="text-base" onClick={confirmDelete}>
              {t(locale, "common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
