"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import Image from "next/image";
import { BuilderQuestionNavigatorDragPreview } from "@/components/quiz-builder/builder-question-navigator-drag-preview";
import { BuilderQuestionNavigatorSortableRow } from "@/components/quiz-builder/builder-question-navigator-sortable-row";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { buildQuestionLabelPreview } from "@/lib/question-label-preview";
import type { Question, QuestionType } from "@/types/quiz-builder";

const PREVIEW_MAX_LEN = 72;

type BuilderQuestionNavigatorProps = {
  locale: Locale;
  questions: Question[];
  activeQuestionId: string | null;
  onQuestionClick: (questionId: string) => void;
  onAddQuestion: () => void;
  onReorder: (nextQuestions: Question[]) => void;
  /** Question ids flagged by validation after a save attempt. */
  questionErrorIds?: ReadonlySet<string>;
  /** Desktop sidebar: full empty state when there are no questions. */
  showDesktopEmptyState?: boolean;
};

function questionTypeShortLabel(locale: Locale, type: QuestionType): string {
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

export function BuilderQuestionNavigator({
  locale,
  questions,
  activeQuestionId,
  onQuestionClick,
  onAddQuestion,
  onReorder,
  questionErrorIds,
  showDesktopEmptyState = false,
}: BuilderQuestionNavigatorProps) {
  const listScrollRef = useRef<HTMLElement | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setOverId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    setOverId(null);
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

  const handleDragCancel = () => {
    setActiveDragId(null);
    setOverId(null);
  };

  useEffect(() => {
    if (!activeQuestionId) {
      return;
    }
    const root = listScrollRef.current;
    if (!root) {
      return;
    }
    let el: HTMLElement | null = null;
    for (const node of root.querySelectorAll("[data-question-nav-item]")) {
      if (!(node instanceof HTMLElement)) {
        continue;
      }
      if (node.getAttribute("data-question-nav-item") === activeQuestionId) {
        el = node;
        break;
      }
    }
    if (!el) {
      return;
    }
    el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeQuestionId, questions]);

  const dragHandleAria = t(locale, "builder.questionNavigatorDragHandleAria");

  const activeDragQuestion =
    activeDragId !== null ? questions.find((q) => q.id === activeDragId) : undefined;

  let dragOverlayPreviewText = "";
  let dragOverlayIndex = 0;
  if (activeDragQuestion !== undefined) {
    dragOverlayIndex = Math.max(
      0,
      questions.findIndex((q) => q.id === activeDragQuestion.id),
    );
    const pv = buildQuestionLabelPreview(activeDragQuestion.label, PREVIEW_MAX_LEN);
    dragOverlayPreviewText =
      pv.trim().length > 0 ? pv : t(locale, "builder.organizeEmptyQuestionPreview");
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-3 border-b border-border/60 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="mb-0 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              {t(locale, "builder.questions")} ({questions.length})
            </p>
          </div>
          {!(showDesktopEmptyState && questions.length === 0) ? (
            <Button
              type="button"
              variant="blue"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onAddQuestion()}
              aria-label={t(locale, "builder.questionNavigatorAddAria")}
            >
              <Plus className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </div>
      <nav
        ref={listScrollRef}
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain p-2 builder-scrollbar"
        aria-label={t(locale, "builder.questionNavigatorAria")}
      >
        {showDesktopEmptyState && questions.length === 0 ? (
          <div className="flex flex-col items-center px-2 py-4 text-center">
            <Image
              src="/todo-illustration.svg"
              alt=""
              width={320}
              height={240}
              className="mb-4 h-auto w-full max-w-[160px]"
            />
            <h3 className="mb-1.5 text-lg font-semibold text-foreground">
              {t(locale, "builder.emptyQuestionsTitleDesktop")}
            </h3>
            <p className="mb-4 text-sm leading-snug text-muted-foreground">
              {t(locale, "builder.emptyQuestionsDescriptionDesktop")}
            </p>
            <Button
              type="button"
              variant="primary"
              size="default"
              className="w-full text-sm"
              onClick={() => onAddQuestion()}
            >
              <Plus className="h-3.5 w-3.5" />
              {t(locale, "builder.addQuestion")}
            </Button>
          </div>
        ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={({ over }) => {
            setOverId(over?.id ? String(over.id) : null);
          }}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {questions.map((question, index) => {
                const isActive = activeQuestionId === question.id;
                const preview = buildQuestionLabelPreview(
                  question.label,
                  PREVIEW_MAX_LEN,
                );
                const displayPreview =
                  preview.trim().length > 0
                    ? preview
                    : t(locale, "builder.organizeEmptyQuestionPreview");
                const showDropIndicatorAbove =
                  activeDragId !== null &&
                  overId !== null &&
                  activeDragId !== overId &&
                  overId === question.id;

                const hasError = questionErrorIds?.has(question.id) ?? false;
                return (
                  <li key={question.id} className="relative">
                    {showDropIndicatorAbove ? (
                      <div
                        className="pointer-events-none absolute -top-px left-0 right-0 z-[1] h-0.5 rounded-full bg-blue shadow-[0_0_10px_hsl(var(--blue)/0.5)] dark:shadow-[0_0_12px_hsl(var(--blue)/0.45)]"
                        aria-hidden
                      />
                    ) : null}
                    <BuilderQuestionNavigatorSortableRow
                      question={question}
                      index={index}
                      isActive={isActive}
                      hasError={hasError}
                      errorIndicatorAriaLabel={t(
                        locale,
                        "builder.questionNavigatorErrorIndicatorAria",
                      )}
                      typeLabel={questionTypeShortLabel(locale, question.type)}
                      displayPreview={displayPreview}
                      dragHandleAriaLabel={dragHandleAria}
                      onNavigate={() => onQuestionClick(question.id)}
                    />
                  </li>
                );
              })}
            </ul>
          </SortableContext>
          <DragOverlay dropAnimation={{ duration: 180, easing: "ease" }}>
            {activeDragQuestion ? (
              <div className="w-full min-w-0 max-w-[15rem]">
                <BuilderQuestionNavigatorDragPreview
                  question={activeDragQuestion}
                  index={dragOverlayIndex}
                  typeLabel={questionTypeShortLabel(locale, activeDragQuestion.type)}
                  displayPreview={dragOverlayPreviewText}
                  dragHandleAriaLabel={dragHandleAria}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
        )}
      </nav>
    </div>
  );
}
