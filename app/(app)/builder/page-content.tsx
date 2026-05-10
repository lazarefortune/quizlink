"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
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
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertCircle, GripVertical, ChevronUp, ChevronDown, Play, Save } from "lucide-react";
import { QuizMenu } from "@/components/quiz-menu";
import { getQuizById } from "@/app/(app)/dashboard/actions";
import { saveQuiz } from "@/app/(app)/builder/actions";
import { track } from "@/lib/analytics/track";
import { QUIZ_CREATED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { QuestionEditor } from "@/components/quiz-builder/question-editor";
import {
  validateQuiz,
  validateBuilderTimeLimit,
  type ValidationError,
} from "@/lib/quiz-validation";
import {
  buildQuizSettingsWithResolvedTimeLimit,
  deriveTimeLimitUiFromSettings,
  parseTimeLimitSeconds,
  resolvePersistedTimeLimit,
  TIME_LIMIT_SECONDS_MAX,
  type BuilderTimeLimitUi,
} from "@/lib/time-limit-seconds";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { buildQuizSuccessPath, shouldRedirectToQuizSuccess } from "@/lib/quiz-success";
import type {
  QuizBuilder,
  Question,
  QuestionType,
  QuizSettings,
} from "@/types/quiz-builder";
import {Textarea} from "@/components/ui/textarea";
import { useBuilderNavigationGuard } from "@/components/dashboard/builder-navigation-guard-context";

function computeQuizBuilderSnapshot(q: QuizBuilder, timeLimitUi: BuilderTimeLimitUi): string {
  return JSON.stringify({
    id: q.id,
    name: q.name,
    visibility: q.visibility,
    settings: {
      ...q.settings,
      timeLimitPerQuestion: resolvePersistedTimeLimit(q.settings, timeLimitUi),
    },
    timeLimitUi,
    questions: q.questions.map((question) => ({
      id: question.id,
      type: question.type,
      label: question.label,
      explanation: question.explanation ?? "",
      image: question.image ?? "",
      options: question.options.map((o) => ({
        id: o.id,
        label: o.label,
        isCorrect: o.isCorrect,
      })),
    })),
  });
}

function loadInitialQuiz(): QuizBuilder {
  if (typeof window !== "undefined") {
    const savedQuiz = sessionStorage.getItem("quizBuilder");
    if (savedQuiz) {
      try {
        const parsed = JSON.parse(savedQuiz) as QuizBuilder;
        sessionStorage.removeItem("quizBuilder");
        return parsed;
      } catch {
        // Fall through to default
      }
    }
  }
  return {
    id: `quiz-${Date.now()}`,
    name: "",
    visibility: "PRIVATE",
    settings: {
      showAnswerImmediately: true,
      randomizeQuestions: false,
      timeLimitPerQuestion: null,
    },
    questions: [],
    createdBy: "USER",
    createdAt: new Date().toISOString(),
  };
}

let cachedInitialQuiz: QuizBuilder | null = null;
function getInitialQuiz(): QuizBuilder {
  if (cachedInitialQuiz === null) {
    cachedInitialQuiz = loadInitialQuiz();
  }
  return cachedInitialQuiz;
}

function createEmptyQuestion(): Question {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    type: "MULTIPLE_CHOICE",
    label: "",
    explanation: "",
    options: [
      {
        id: `opt-${Date.now()}-1`,
        label: "",
        isCorrect: false,
      },
      {
        id: `opt-${Date.now()}-2`,
        label: "",
        isCorrect: false,
      },
    ],
  };
}

type SortableQuestionItemProps = {
  question: Question;
  index: number;
  totalQuestions: number;
  onChange: (updatedQuestion: Question) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  errors: string[];
  isNewlyAdded?: boolean;
  isRemoving?: boolean;
  onAnimationEnd?: () => void;
  onRemoveAnimationEnd?: () => void;
};

function SortableQuestionItem({
  question,
  index,
  totalQuestions,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
  errors,
  isNewlyAdded = false,
  isRemoving = false,
  onAnimationEnd,
  onRemoveAnimationEnd,
}: SortableQuestionItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
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
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isNewlyAdded && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isNewlyAdded]);

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (itemRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }}
      style={style}
      className={cn(
        "relative group rounded-lg p-2",
        index % 2 === 0 ? "bg-background" : "bg-muted/30",
        isNewlyAdded && "animate-question-appear",
        isRemoving && "animate-question-remove pointer-events-none",
      )}
      onAnimationEnd={
        isRemoving
          ? onRemoveAnimationEnd
          : isNewlyAdded
            ? onAnimationEnd
            : undefined
      }
    >

      <div className="flex items-start gap-2">
        {/* Drag handle and arrows */}
        <div className="flex flex-col items-center gap-1 pt-6 shrink-0">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveUp}
            disabled={index === 0}
          >
            <ChevronUp className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onMoveDown}
            disabled={index === totalQuestions - 1}
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        <div className="flex-1 min-w-0">
          <QuestionEditor
            question={question}
            index={index}
            totalQuestions={totalQuestions}
            onChange={onChange}
            onDelete={onDelete}
            onMoveUp={onMoveUp}
            onMoveDown={onMoveDown}
            errors={errors}
          />
        </div>
      </div>
    </div>
  );
}

type BuilderPageContentProps = {
  initialQuizId?: string;
};

export function BuilderPageContent({ initialQuizId }: BuilderPageContentProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  useSession();
  const [quiz, setQuiz] = useState<QuizBuilder>(() => getInitialQuiz());
  const [timeLimitUi, setTimeLimitUi] = useState<BuilderTimeLimitUi>(() =>
    deriveTimeLimitUiFromSettings(getInitialQuiz().settings),
  );
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newlyAddedQuestionId, setNewlyAddedQuestionId] = useState<string | null>(null);
  const [removingQuestionId, setRemovingQuestionId] = useState<string | null>(null);
  const [, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null);
  const unsavedBaselineRef = useRef<string | null>(null);
  const { showToast } = useToast();
  const {
    setBuilderHasUnsavedChanges,
    runNavigationBypass,
    requestNavigate,
  } = useBuilderNavigationGuard();

  const syncDirtyToGuard = useCallback(() => {
    if (unsavedBaselineRef.current === null) {
      setBuilderHasUnsavedChanges(false);
      return;
    }
    setBuilderHasUnsavedChanges(
      computeQuizBuilderSnapshot(quiz, timeLimitUi) !== unsavedBaselineRef.current,
    );
  }, [quiz, timeLimitUi, setBuilderHasUnsavedChanges]);

  useEffect(() => {
    syncDirtyToGuard();
    return () => setBuilderHasUnsavedChanges(false);
  }, [syncDirtyToGuard, setBuilderHasUnsavedChanges]);

  // Check if quiz exists in database (ID starts with "cl" for Prisma cuid)
  const isQuizSaved = savedQuizId !== null || Boolean(quiz.id?.startsWith("cl"));

  useEffect(() => {
    const urlQuizId = initialQuizId || searchParams.get("quizId");
    if (!urlQuizId && unsavedBaselineRef.current === null) {
      unsavedBaselineRef.current = computeQuizBuilderSnapshot(quiz, timeLimitUi);
    }
  }, [initialQuizId, searchParams, quiz, timeLimitUi]);

  // Load quiz from URL if quizId is present
  useEffect(() => {
    const quizId = initialQuizId || searchParams.get("quizId");
    if (quizId && quizId !== savedQuizId) {
      setIsLoading(true);

      getQuizById(quizId)
        .then((result) => {
          if (result.success && result.quiz) {
            const loadedQuiz: QuizBuilder = {
              id: result.quiz.id,
              name: result.quiz.name,
              visibility: result.quiz.visibility,
              settings: result.quiz.settings as QuizSettings,
              questions: result.quiz.questions.map((q: { id: string; type: string; label: string; image?: string; explanation?: string; options: { id: string; label: string; isCorrect: boolean }[] }) => ({
                id: q.id,
                type: q.type as QuestionType,
                label: q.label,
                image: q.image,
                explanation: q.explanation ?? undefined,
                options: q.options.map((opt: { id: string; label: string; isCorrect: boolean }) => ({
                  id: opt.id,
                  label: opt.label,
                  isCorrect: opt.isCorrect,
                })),
              })),
              createdBy: "USER",
              createdAt: result.quiz.createdAt,
            };
            setQuiz(loadedQuiz);
            setSavedQuizId(result.quiz.id);
            const loadedTimeLimitUi = deriveTimeLimitUiFromSettings(loadedQuiz.settings);
            setTimeLimitUi(loadedTimeLimitUi);
            unsavedBaselineRef.current = computeQuizBuilderSnapshot(
              loadedQuiz,
              loadedTimeLimitUi,
            );
          } else {
            showToast(result.error || t(locale, "common.error"), "error");
          }
        })
        .catch((error) => {
          console.error("Error loading quiz:", error);
          showToast(t(locale, "common.error"), "error");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
    // Do not router.replace to `/builder/${savedQuizId}` here when `savedQuizId` was just
    // set after creating a quiz: it races with `router.push` to `/dashboard/quiz/.../success`
    // and cancels the success redirect. URL sync after save is handled in handleSave when needed.
  }, [initialQuizId, searchParams, savedQuizId, router, locale, showToast]);

  useEffect(() => {
    if (unsavedBaselineRef.current === null) {
      return;
    }
    const isDirty =
      computeQuizBuilderSnapshot(quiz, timeLimitUi) !== unsavedBaselineRef.current;
    if (!isDirty) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [quiz, timeLimitUi]);

  const handleSave = async () => {
    const timeLimitError = validateBuilderTimeLimit(timeLimitUi);
    const errors = validateQuiz(quiz);
    const mergedErrors = timeLimitError ? [...errors, timeLimitError] : errors;
    if (mergedErrors.length > 0) {
      setValidationErrors(mergedErrors);
      return;
    }

    const quizToSave: QuizBuilder = {
      ...quiz,
      settings: buildQuizSettingsWithResolvedTimeLimit(quiz.settings, timeLimitUi),
    };

    setIsSaving(true);
    try {
      const isExistingQuiz = isQuizSaved;
      const result = await saveQuiz(quizToSave, savedQuizId || undefined);

      if (result.success) {
        const mergedQuiz: QuizBuilder =
          result.quizId !== undefined ? { ...quizToSave, id: result.quizId } : quizToSave;
        const normalizedTimeLimitUi = deriveTimeLimitUiFromSettings(mergedQuiz.settings);

        if (result.quizId) {
          setSavedQuizId(result.quizId);
          // Update quiz ID if it was a new quiz
          if (!isQuizSaved && result.quizId) {
            const settings = mergedQuiz.settings ?? {
              showAnswerImmediately: false,
              randomizeQuestions: false,
              timeLimitPerQuestion: null,
            };
            track(QUIZ_CREATED, {
              ...buildCommonEventProps({
                isLoggedIn: true,
                preferredLanguage: locale,
              }),
              quiz_id: result.quizId,
              source: "builder",
              visibility: mergedQuiz.visibility,
              question_count: mergedQuiz.questions.length,
              has_time_limit: settings.timeLimitPerQuestion != null && settings.timeLimitPerQuestion > 0,
              show_answer_immediately: settings.showAnswerImmediately,
              randomized: settings.randomizeQuestions,
            });
            setQuiz({ ...quizToSave, id: result.quizId });
            setTimeLimitUi(normalizedTimeLimitUi);
            if (
              shouldRedirectToQuizSuccess({
                isExistingQuiz,
                quizId: result.quizId,
              })
            ) {
              unsavedBaselineRef.current = computeQuizBuilderSnapshot(
                mergedQuiz,
                normalizedTimeLimitUi,
              );
              runNavigationBypass(() => {
                setBuilderHasUnsavedChanges(false);
                router.push(buildQuizSuccessPath(result.quizId));
              });
              return;
            }
          }
        }

        setQuiz(mergedQuiz);
        setTimeLimitUi(normalizedTimeLimitUi);
        unsavedBaselineRef.current = computeQuizBuilderSnapshot(
          mergedQuiz,
          normalizedTimeLimitUi,
        );
        syncDirtyToGuard();

        const message = isQuizSaved
          ? t(locale, "builder.quizSaved")
          : t(locale, "builder.quizCreated");

        showToast(message, "success");
      } else {
        showToast(result.error || t(locale, "builder.saveError"), "error");
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      showToast(t(locale, "builder.saveError"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddQuestion = (insertIndex?: number) => {
    const newQuestion = createEmptyQuestion();
    setNewlyAddedQuestionId(newQuestion.id);

    if (insertIndex !== undefined) {
      const newQuestions = [...quiz.questions];
      newQuestions.splice(insertIndex, 0, newQuestion);
      setQuiz({
        ...quiz,
        questions: newQuestions,
      });
    } else {
      setQuiz({
        ...quiz,
        questions: [...quiz.questions, newQuestion],
      });
    }
  };

  const handleQuestionChange = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...quiz.questions];
    newQuestions[index] = updatedQuestion;
    setQuiz({
      ...quiz,
      questions: newQuestions,
    });
    setValidationErrors([]);
  };

  const handleDeleteQuestion = (index: number) => {
    const questionId = quiz.questions[index]?.id;
    if (!questionId) return;

    setRemovingQuestionId(questionId);
  };

  const commitDeleteQuestion = (questionId: string) => {
    const newQuestions = quiz.questions.filter((q) => q.id !== questionId);
    setRemovingQuestionId(null);
    setQuiz({
      ...quiz,
      questions: newQuestions,
    });
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === quiz.questions.length - 1)
    ) {
      return;
    }

    const newQuestions = [...quiz.questions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[index],
    ];

    setQuiz({
      ...quiz,
      questions: newQuestions,
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = quiz.questions.findIndex((q) => q.id === active.id);
      const newIndex = quiz.questions.findIndex((q) => q.id === over.id);

      setQuiz({
        ...quiz,
        questions: arrayMove(quiz.questions, oldIndex, newIndex),
      });
    }

    setActiveId(null);
  };

  const getQuestionErrors = (questionIndex: number): string[] => {
    return validationErrors
      .filter((error) => error.field.startsWith(`questions[${questionIndex}]`))
      .map((error) => t(locale, error.translationKey, error.params || {}));
  };

  const getNameError = (): string | null => {
    const nameError = validationErrors.find((error) => error.field === "name");
    if (!nameError) return null;
    return t(locale, nameError.translationKey, nameError.params || {});
  };

  const getTimeLimitError = (): string | null => {
    const timeLimitError = validationErrors.find(
      (error) => error.field === "settings.timeLimitPerQuestion",
    );
    if (!timeLimitError) return null;
    return t(locale, timeLimitError.translationKey, timeLimitError.params || {});
  };

  const activeQuestion = activeId
    ? quiz.questions.find((q) => q.id === activeId)
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-4rem)]">
        {/* Sidebar - Options */}
        <aside className="w-full lg:w-80 border-r border-b border-border/60 lg:border-b-0 bg-muted/30 lg:overflow-y-auto shrink-0 relative z-10">
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h2 className="uppercase h1 text-lg font-semibold mb-3 sm:mb-4">{t(locale, "builder.optionsTitle")}</h2>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-sm font-medium">
                  {t(locale, "builder.quizName")}
                </label>
                <div className="space-y-1">
                  <Textarea
                    value={quiz.name}
                    onChange={(e) => {
                      setQuiz({ ...quiz, name: e.target.value });
                      setValidationErrors((prev) => prev.filter((err) => err.field !== "name"));
                    }}
                    required
                    className={cn("text-base", getNameError() ? "border-destructive focus-visible:border-destructive" : "")}
                  />
                  {getNameError() && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {getNameError()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-border/60">
              <div className="flex items-start gap-2">
                <Switch
                  checked={quiz.settings.showAnswerImmediately}
                  onCheckedChange={(checked: boolean) =>
                    setQuiz({
                      ...quiz,
                      settings: {
                        ...quiz.settings,
                        showAnswerImmediately: checked,
                      },
                    })
                  }
                  className="mt-0.5 shrink-0"
                />
                <div className="flex items-start flex-1 min-w-0 gap-1">
                  <label className="text-sm font-medium wrap-break-word flex-1">
                    {t(locale, "builder.showAnswerImmediately")}
                  </label>
                  <InfoTooltip content={t(locale, "builder.showAnswerDescription")} className="shrink-0" />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Switch
                  checked={quiz.settings.randomizeQuestions}
                  onCheckedChange={(checked: boolean) =>
                    setQuiz({
                      ...quiz,
                      settings: {
                        ...quiz.settings,
                        randomizeQuestions: checked,
                      },
                    })
                  }
                  className="mt-0.5 shrink-0"
                />
                <div className="flex items-start flex-1 min-w-0 gap-1">
                  <label className="text-sm font-medium wrap-break-word flex-1">
                    {t(locale, "builder.randomizeQuestions")}
                  </label>
                  <InfoTooltip content={t(locale, "builder.randomizeDescription")} className="shrink-0" />
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Switch
                  checked={timeLimitUi.enabled}
                  onCheckedChange={(checked: boolean) => {
                    setTimeLimitUi(
                      checked ? { enabled: true, inputValue: "30" } : { enabled: false, inputValue: "" },
                    );
                    setQuiz({
                      ...quiz,
                      settings: {
                        ...quiz.settings,
                        timeLimitPerQuestion: checked ? 30 : null,
                      },
                    });
                    setValidationErrors((prev) =>
                      prev.filter((err) => err.field !== "settings.timeLimitPerQuestion"),
                    );
                  }}
                  className="mt-0.5 shrink-0"
                />
                <div className="flex items-start flex-1 min-w-0 gap-1">
                  <label className="text-sm font-medium wrap-break-word flex-1">
                    {t(locale, "builder.timeLimitPerQuestion")}
                  </label>
                  <InfoTooltip content={t(locale, "options.timeLimitPlaceholder")} className="shrink-0" />
                </div>
              </div>

              {timeLimitUi.enabled && (
                <div className="pl-0 sm:pl-4 space-y-1">
                  <Input
                    type="number"
                    min={1}
                    max={TIME_LIMIT_SECONDS_MAX}
                    value={timeLimitUi.inputValue}
                    onChange={(e) => {
                      const raw = e.target.value;
                      setTimeLimitUi((prev) => ({ ...prev, inputValue: raw }));
                      const parsed = parseTimeLimitSeconds(raw);
                      setQuiz((prev) => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          timeLimitPerQuestion:
                            parsed !== null ? parsed : prev.settings.timeLimitPerQuestion,
                        },
                      }));
                      setValidationErrors((prev) =>
                        prev.filter((err) => err.field !== "settings.timeLimitPerQuestion"),
                      );
                    }}
                    className={cn(
                      "w-full text-sm",
                      getTimeLimitError() ? "border-destructive focus-visible:border-destructive" : "",
                    )}
                    aria-invalid={getTimeLimitError() !== null}
                  />
                  {getTimeLimitError() && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" />
                      {getTimeLimitError()}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content - Questions */}
        <main className="flex-1 lg:overflow-y-auto min-w-0 bg-muted/10">
          <div className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold h1">{t(locale, "builder.title")}</h1>
                {quiz.questions.length > 0 && (
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {quiz.questions.length} {quiz.questions.length === 1 ? t(locale, "dashboard.question") : t(locale, "dashboard.questions")}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="blue"
                  onClick={handleSave}
                  disabled={quiz.questions.length === 0 || isSaving}
                  className="flex-1 sm:flex-initial text-base relative"
                  size="default"
                >
                  <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                  {isSaving
                    ? t(locale, "common.loading")
                    : isQuizSaved
                    ? t(locale, "builder.saveQuiz")
                    : t(locale, "builder.createQuiz")}
                  {validationErrors.length > 0 && (
                    <Badge
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground border-destructive"
                    >
                      {validationErrors.length}
                    </Badge>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled
                  className="flex-1 sm:flex-initial text-base"
                  size="default"
                  title={t(locale, "builder.previewComingSoon")}
                  aria-label={t(locale, "builder.previewComingSoon")}
                >
                  <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                  {t(locale, "builder.previewQuiz")}
                </Button>
                {isQuizSaved && savedQuizId && (
                  <QuizMenu
                    quizId={savedQuizId}
                    quizName={quiz.name}
                    onDeleted={() => {
                      requestNavigate("/dashboard");
                    }}
                  />
                )}
              </div>
            </div>

            {quiz.questions.length === 0 ? (
              <Card>
                <CardContent className="py-8 sm:py-12 text-center">
                  <p className="text-base text-muted-foreground mb-4">
                    {t(locale, "builder.noQuestions")}
                  </p>
                  <Button variant="primary" onClick={() => handleAddQuestion()} size="default" className="text-base">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    {t(locale, "builder.addQuestion")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={quiz.questions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div>
                    {quiz.questions.map((question, index) => (
                      <div key={question.id}>
                        {/* Insert zone between questions - positioned as a separate element */}
                        {index > 0 && (
                          <div className="relative h-4 -my-2 group/insert z-20 flex items-center justify-center">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover/insert:opacity-100 transition-opacity pointer-events-none">
                              <div className="h-0.5 w-24 bg-blue/60 rounded-full shadow-sm" />
                              <Button
                                variant="blue"
                                size="icon"
                                className="h-7 w-7 rounded-full pointer-events-auto shadow-lg z-30 shrink-0"
                                onClick={() => handleAddQuestion(index)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <div className="h-0.5 w-24 bg-blue/60 rounded-full shadow-sm" />
                            </div>
                          </div>
                        )}
                        <div className="relative z-10">
                          <SortableQuestionItem
                            question={question}
                            index={index}
                            totalQuestions={quiz.questions.length}
                            onChange={(updatedQuestion) =>
                              handleQuestionChange(index, updatedQuestion)
                            }
                            onDelete={() => handleDeleteQuestion(index)}
                            onMoveUp={() => handleMoveQuestion(index, "up")}
                            onMoveDown={() => handleMoveQuestion(index, "down")}
                            errors={getQuestionErrors(index)}
                            isNewlyAdded={newlyAddedQuestionId === question.id}
                            isRemoving={removingQuestionId === question.id}
                            onAnimationEnd={() => setNewlyAddedQuestionId(null)}
                            onRemoveAnimationEnd={() => commitDeleteQuestion(question.id)}
                          />
                        </div>
                      </div>
                    ))}
                    {/* Insert zone at the end */}
                    <div className="relative h-4 mt-4 group/insert z-20 flex items-center justify-center">
                      <div className="flex items-center justify-center gap-2 opacity-0 group-hover/insert:opacity-100 transition-opacity pointer-events-none">
                        <div className="h-0.5 w-24 bg-blue/60 rounded-full shadow-sm" />
                        <Button
                          variant="blue"
                          size="icon"
                          className="h-7 w-7 rounded-full pointer-events-auto shadow-lg z-30 shrink-0"
                          onClick={() => handleAddQuestion(quiz.questions.length)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <div className="h-0.5 w-24 bg-blue/60 rounded-full shadow-sm" />
                      </div>
                    </div>
                  </div>
                </SortableContext>
                <DragOverlay>
                  {activeQuestion ? (
                    <div className="opacity-50">
                      <QuestionEditor
                        question={activeQuestion}
                        index={0}
                        totalQuestions={1}
                        onChange={() => {}}
                        onDelete={() => {}}
                        onMoveUp={() => {}}
                        onMoveDown={() => {}}
                        errors={[]}
                      />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}

            {quiz.questions.length > 0 && (
              <div className="flex justify-center pt-4">
                <Button variant="blue" onClick={() => handleAddQuestion()} size="default" className="text-base">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  {t(locale, "builder.addQuestion")}
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

