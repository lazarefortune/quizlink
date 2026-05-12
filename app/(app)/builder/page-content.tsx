"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertCircle, ChevronDown, Play, Save } from "lucide-react";
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
  hasQuizOptionsPanelErrors,
  validateQuiz,
  validateBuilderTimeLimit,
  type ValidationError,
} from "@/lib/quiz-validation";
import {
  buildQuizSettingsWithResolvedTimeLimit,
  deriveTimeLimitUiFromSettings,
  resolvePersistedTimeLimit,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BuilderOrganizeQuestionsList } from "@/components/quiz-builder/builder-organize-questions-list";
import { BuilderQuizOptionsFields } from "@/components/quiz-builder/builder-quiz-options-fields";
import { BuilderBackToTopButton } from "@/components/quiz-builder/builder-back-to-top-button";
import { useBuilderNavigationGuard } from "@/components/dashboard/builder-navigation-guard-context";
import { resolveMobileQuizOptionsOpenAfterQuestionCountChange } from "@/lib/builder-mobile-quiz-options";
import { estimateQuizPayloadSize } from "@/lib/builder/estimateQuizPayloadSize";
import { isSaveQuizPayloadTooLargeError } from "@/lib/builder/isSaveQuizPayloadTooLargeError";
import {
  QUIZ_SAVE_PAYLOAD_WARN_BYTES,
} from "@/lib/builder/quizPayloadLimits";

type BuilderViewMode = "edit" | "organize";

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

type BuilderEditQuestionItemProps = {
  question: Question;
  index: number;
  totalQuestions: number;
  onChange: (updatedQuestion: Question) => void;
  onDelete: () => void;
  errors: string[];
  isNewlyAdded?: boolean;
  isRemoving?: boolean;
  onAnimationEnd?: () => void;
  onRemoveAnimationEnd?: () => void;
};

/** Edit tab: full-width editor only — reordering lives in the Organiser tab. */
function BuilderEditQuestionItem({
  question,
  index,
  totalQuestions,
  onChange,
  onDelete,
  errors,
  isNewlyAdded = false,
  isRemoving = false,
  onAnimationEnd,
  onRemoveAnimationEnd,
}: BuilderEditQuestionItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNewlyAdded && itemRef.current) {
      itemRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isNewlyAdded]);

  return (
    <div
      id={`builder-question-${question.id}`}
      ref={itemRef}
      className={cn(
        "relative group w-full min-w-0 rounded-lg p-2",
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
      <motion.div
        className="flex w-full min-w-0 flex-col"
        initial={isNewlyAdded ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <div className="min-w-0 w-full">
          <QuestionEditor
            question={question}
            index={index}
            totalQuestions={totalQuestions}
            onChange={onChange}
            onDelete={onDelete}
            onMoveUp={() => {}}
            onMoveDown={() => {}}
            errors={errors}
          />
        </div>
      </motion.div>
    </div>
  );
}

type BuilderPageContentProps = {
  initialQuizId?: string;
};

export function BuilderPageContent({ initialQuizId }: BuilderPageContentProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuizId = initialQuizId ?? searchParams.get("quizId");
  const { locale } = useLocale();
  useSession();
  const [quiz, setQuiz] = useState<QuizBuilder>(() => getInitialQuiz());
  const [timeLimitUi, setTimeLimitUi] = useState<BuilderTimeLimitUi>(() =>
    deriveTimeLimitUiFromSettings(getInitialQuiz().settings),
  );
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [mobileQuizOptionsOpen, setMobileQuizOptionsOpen] = useState(() => {
    if (urlQuizId) {
      return false;
    }
    return getInitialQuiz().questions.length === 0;
  });
  const previousQuestionCountRef = useRef(quiz.questions.length);
  const [newlyAddedQuestionId, setNewlyAddedQuestionId] = useState<string | null>(null);
  const [removingQuestionId, setRemovingQuestionId] = useState<string | null>(null);
  const [, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null);
  const [builderViewMode, setBuilderViewMode] = useState<BuilderViewMode>("edit");
  const [scrollToQuestionId, setScrollToQuestionId] = useState<string | null>(null);
  const unsavedBaselineRef = useRef<string | null>(null);
  const builderMainScrollRef = useRef<HTMLElement | null>(null);
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

  useEffect(() => {
    if (hasQuizOptionsPanelErrors(validationErrors)) {
      setMobileQuizOptionsOpen(true);
    }
  }, [validationErrors]);

  useEffect(() => {
    const prev = previousQuestionCountRef.current;
    const nextCount = quiz.questions.length;
    const resolved = resolveMobileQuizOptionsOpenAfterQuestionCountChange(
      prev,
      nextCount,
    );
    if (resolved !== null) {
      const shouldSkipAutoClose =
        resolved === false &&
        prev === 0 &&
        nextCount > 0 &&
        hasQuizOptionsPanelErrors(validationErrors);
      if (!shouldSkipAutoClose) {
        setMobileQuizOptionsOpen(resolved);
      }
    }
    previousQuestionCountRef.current = nextCount;
  }, [quiz.questions.length, validationErrors]);

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

  useEffect(() => {
    if (builderViewMode !== "edit" || scrollToQuestionId === null) {
      return;
    }
    const targetId = scrollToQuestionId;
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }
        document.getElementById(`builder-question-${targetId}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setScrollToQuestionId(null);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [builderViewMode, scrollToQuestionId]);

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

    const estimatedBytes = estimateQuizPayloadSize(quizToSave);
    if (estimatedBytes >= QUIZ_SAVE_PAYLOAD_WARN_BYTES) {
      const shouldContinue = window.confirm(t(locale, "builder.savePayloadHeavyConfirm"));
      if (!shouldContinue) {
        return;
      }
    }

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
      if (isSaveQuizPayloadTooLargeError(error)) {
        showToast(t(locale, "builder.saveErrorPayloadTooLarge"), "error");
      } else {
        showToast(t(locale, "builder.saveError"), "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

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
    setBuilderViewMode("edit");
  };

  const handleEditQuestionFromOrganize = (questionId: string) => {
    setBuilderViewMode("edit");
    setScrollToQuestionId(questionId);
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

  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background w-full">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:items-stretch">
        {/* Desktop: options sidebar */}
        <aside className="relative z-10 hidden w-full shrink-0 border-r border-border/60 bg-muted/30 lg:flex lg:w-80 lg:flex-col lg:overflow-y-auto">
          <div className="space-y-4 p-4 sm:space-y-6 sm:p-6">
            <div>
              <h2 className="h1 mb-3 text-lg font-semibold uppercase sm:mb-4">{t(locale, "builder.optionsTitle")}</h2>
            </div>
            <BuilderQuizOptionsFields
              quiz={quiz}
              setQuiz={setQuiz}
              timeLimitUi={timeLimitUi}
              setTimeLimitUi={setTimeLimitUi}
              locale={locale}
              getNameError={getNameError}
              getTimeLimitError={getTimeLimitError}
              setValidationErrors={setValidationErrors}
            />
          </div>
        </aside>

        {/* Mobile: compact collapsible strip — questions stay primary below */}
        <div className="shrink-0 border-b border-border/60 bg-muted/30 lg:hidden">
          <Collapsible
            open={mobileQuizOptionsOpen}
            onOpenChange={setMobileQuizOptionsOpen}
          >
            <CollapsibleTrigger
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-3 text-left outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&[data-state=open]>svg]:rotate-180",
                !prefersReducedMotion && "duration-300 ease-out",
              )}
            >
              <div className="min-w-0">
                <p className="text-base font-semibold leading-tight">{t(locale, "builder.optionsTitle")}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(
                    locale,
                    mobileQuizOptionsOpen
                      ? "builder.optionsMobileHintOpen"
                      : "builder.optionsMobileHintClosed",
                  )}
                </p>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                  prefersReducedMotion ? "duration-0" : "duration-300 ease-out",
                )}
              />
            </CollapsibleTrigger>
            <CollapsibleContent
              className={cn(
                "overflow-hidden",
                "data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up",
                "motion-reduce:data-[state=open]:animate-none motion-reduce:data-[state=closed]:animate-none",
              )}
            >
              <motion.div
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={
                  prefersReducedMotion
                    ? { duration: 0 }
                    : { duration: 0.22, ease: [0.22, 1, 0.36, 1], delay: 0.05 }
                }
                className="border-t border-border/40 px-4 pb-4 pt-3"
              >
                <div className="space-y-4">
                  <BuilderQuizOptionsFields
                    quiz={quiz}
                    setQuiz={setQuiz}
                    timeLimitUi={timeLimitUi}
                    setTimeLimitUi={setTimeLimitUi}
                    locale={locale}
                    getNameError={getNameError}
                    getTimeLimitError={getTimeLimitError}
                    setValidationErrors={setValidationErrors}
                  />
                </div>
              </motion.div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Main Content - Questions */}
        <main
          ref={builderMainScrollRef}
          className="relative flex min-h-0 flex-1 scroll-pt-4 overflow-y-auto bg-muted/10 min-w-0"
        >
          <div className="w-full min-w-0 max-w-none px-3 pt-3 pb-10 sm:px-4 sm:pt-4 sm:pb-12 md:px-6 md:pt-6 md:pb-16">
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
              <Tabs
                value={builderViewMode}
                onValueChange={(value) => setBuilderViewMode(value as BuilderViewMode)}
                className="w-full min-w-0"
              >
                <TabsList className="mb-4 grid h-auto w-full grid-cols-2 sm:inline-flex sm:w-auto">
                  <TabsTrigger value="edit" className="text-base">
                    {t(locale, "builder.viewModeEdit")}
                  </TabsTrigger>
                  <TabsTrigger value="organize" className="text-base">
                    {t(locale, "builder.viewModeOrganize")}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="edit" className="mt-0 w-full min-w-0 outline-none">
                  <div className="w-full min-w-0">
                    {quiz.questions.map((question, index) => (
                      <div key={question.id}>
                        {index > 0 && (
                          <div className="relative z-20 -my-2 flex h-4 items-center justify-center group/insert">
                            <div className="pointer-events-none flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover/insert:opacity-100">
                              <div className="h-0.5 w-24 rounded-full bg-blue/60 shadow-sm" />
                              <Button
                                variant="blue"
                                size="icon"
                                className="z-30 h-7 w-7 shrink-0 rounded-full shadow-lg pointer-events-auto"
                                onClick={() => handleAddQuestion(index)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <div className="h-0.5 w-24 rounded-full bg-blue/60 shadow-sm" />
                            </div>
                          </div>
                        )}
                        <div className="relative z-10">
                          <BuilderEditQuestionItem
                            question={question}
                            index={index}
                            totalQuestions={quiz.questions.length}
                            onChange={(updatedQuestion) =>
                              handleQuestionChange(index, updatedQuestion)
                            }
                            onDelete={() => handleDeleteQuestion(index)}
                            errors={getQuestionErrors(index)}
                            isNewlyAdded={newlyAddedQuestionId === question.id}
                            isRemoving={removingQuestionId === question.id}
                            onAnimationEnd={() => setNewlyAddedQuestionId(null)}
                            onRemoveAnimationEnd={() => commitDeleteQuestion(question.id)}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="relative z-20 mt-4 flex h-4 items-center justify-center group/insert">
                      <div className="pointer-events-none flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover/insert:opacity-100">
                        <div className="h-0.5 w-24 rounded-full bg-blue/60 shadow-sm" />
                        <Button
                          variant="blue"
                          size="icon"
                          className="z-30 h-7 w-7 shrink-0 rounded-full shadow-lg pointer-events-auto"
                          onClick={() => handleAddQuestion(quiz.questions.length)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <div className="h-0.5 w-24 rounded-full bg-blue/60 shadow-sm" />
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="organize" className="mt-0 outline-none">
                  <BuilderOrganizeQuestionsList
                    locale={locale}
                    questions={quiz.questions}
                    onReorder={(nextQuestions) =>
                      setQuiz({
                        ...quiz,
                        questions: nextQuestions,
                      })
                    }
                    onMoveUp={(index) => handleMoveQuestion(index, "up")}
                    onMoveDown={(index) => handleMoveQuestion(index, "down")}
                    onDeleteQuestion={commitDeleteQuestion}
                    onEditQuestion={handleEditQuestionFromOrganize}
                  />
                </TabsContent>
              </Tabs>
            )}

            {quiz.questions.length > 0 && (
              <div className="mt-4 flex justify-center">
                <Button variant="blue" onClick={() => handleAddQuestion()} size="default" className="text-base mb-10">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                  {t(locale, "builder.addQuestion")}
                </Button>
              </div>
            )}
          </div>
        </main>
        {quiz.questions.length > 0 ? (
          <BuilderBackToTopButton
            scrollContainerRef={builderMainScrollRef}
            layoutKey={`${quiz.questions.length}-${builderViewMode}`}
            label={t(locale, "builder.backToTop")}
          />
        ) : null}
      </div>
    </div>
  );
}

