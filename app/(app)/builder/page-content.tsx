"use client";

import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronDown, Save, CheckCircle2 } from "lucide-react";
import { QuizMenu } from "@/components/quiz-menu";
import { QuizStatusBadge } from "@/components/quiz/quiz-status-badge";
import { getQuizById } from "@/app/(app)/dashboard/actions";
import {
  getActiveQuizSaveStatsWarning,
  saveQuiz,
  finalizeDraftQuizAction,
  saveModifiedQuizAsDraftCopyAction,
} from "@/app/(app)/builder/actions";
import { track } from "@/lib/analytics/track";
import { QUIZ_CREATED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import { useSession } from "next-auth/react";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
} from "@/types/quiz-builder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { BuilderOrganizeQuestionsList } from "@/components/quiz-builder/builder-organize-questions-list";
import { BuilderQuizOptionsFields } from "@/components/quiz-builder/builder-quiz-options-fields";
import { BuilderSaveStatus } from "@/components/quiz-builder/builder-save-status";
import { BuilderBackToTopButton } from "@/components/quiz-builder/builder-back-to-top-button";
import { FullscreenBlockingOverlay } from "@/components/ui/fullscreen-blocking-overlay";
import { useBuilderNavigationGuard } from "@/components/dashboard/builder-navigation-guard-context";
import { resolveMobileQuizOptionsOpenAfterQuestionCountChange } from "@/lib/builder-mobile-quiz-options";
import { DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS } from "@/lib/builder/defaultManualQuizSettings";
import { resolveFinalizeDraftQuizError } from "@/lib/builder/finalizeDraftQuizErrors";
import { estimateQuizPayloadSize } from "@/lib/builder/estimateQuizPayloadSize";
import { isSaveQuizPayloadTooLargeError } from "@/lib/builder/isSaveQuizPayloadTooLargeError";
import {
  QUIZ_SAVE_PAYLOAD_WARN_BYTES,
} from "@/lib/builder/quizPayloadLimits";
import { BUILDER_SESSION_TRANSFER_QUIZ_KEY } from "@/lib/builder/builderClientStorageKeys";
import {
  buildBuilderDraftKey,
  clearBuilderDraftAndIndexEntry,
  createBuilderLocalDraftPayload,
  getBuilderDraftStorageScope,
  loadBuilderDraft,
  saveBuilderDraft,
  shouldOfferBuilderLocalDraftRestore,
  type BuilderLocalDraftPayload,
} from "@/lib/builder/builderLocalDraft";
import { buildPlayableContentMultisetKey } from "@/lib/builder/quizContentChangeDetection";
import { computeQuizBuilderSnapshot } from "@/lib/builder/quizBuilderSnapshot";
import { mergeQuizSettingsFromStored } from "@/lib/quiz/mergeQuizSettingsFromStored";
import {
  evaluateServerAutosaveGate,
  SERVER_AUTOSAVE_DEBOUNCE_MS,
} from "@/lib/builder/serverAutosaveGate";
import type { BuilderServerSaveUiPhase } from "@/lib/builder/builderSaveStatusDisplay";

type BuilderViewMode = "edit" | "organize";

function loadInitialQuiz(): QuizBuilder {
  if (typeof window !== "undefined") {
    const savedQuiz = sessionStorage.getItem(BUILDER_SESSION_TRANSFER_QUIZ_KEY);
    if (savedQuiz) {
      try {
        const parsed = JSON.parse(savedQuiz) as QuizBuilder;
        sessionStorage.removeItem(BUILDER_SESSION_TRANSFER_QUIZ_KEY);
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
    settings: { ...DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS },
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
  quizIdForImageUpload: string | null;
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
  quizIdForImageUpload,
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
            quizIdForImageUpload={quizIdForImageUpload}
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlQuizId = initialQuizId ?? searchParams.get("quizId");
  const { locale } = useLocale();
  const { data: session } = useSession();
  const userId = session?.user?.id;
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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalizingDraft, setIsFinalizingDraft] = useState(false);
  const [baselineSnapshotForUi, setBaselineSnapshotForUi] = useState<string | null>(null);
  const [serverSaveUiPhase, setServerSaveUiPhase] = useState<BuilderServerSaveUiPhase>("idle");
  const [lastServerAutosaveSuccessAt, setLastServerAutosaveSuccessAt] = useState<number | null>(
    null,
  );
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null);
  const [serverQuizStatus, setServerQuizStatus] = useState<QuizLifecycleStatus | null>(null);
  const serverQuizStatusRef = useRef<QuizLifecycleStatus | null>(null);
  const quizIdForImageUpload = savedQuizId ?? urlQuizId ?? null;
  const displayedEditorialStatus = urlQuizId ? serverQuizStatus : null;
  const [builderViewMode, setBuilderViewMode] = useState<BuilderViewMode>("edit");
  const [scrollToQuestionId, setScrollToQuestionId] = useState<string | null>(null);
  const unsavedBaselineRef = useRef<string | null>(null);
  const baselinePlayableMultisetKeyRef = useRef<string | null>(null);
  const quizRef = useRef(quiz);
  const timeLimitUiRef = useRef(timeLimitUi);
  const userIdRef = useRef<string | undefined>(undefined);
  const urlQuizIdRef = useRef<string | null>(null);
  const savedQuizIdRef = useRef<string | null>(null);
  const hasCapturedHydratedBaselineForDraftRef = useRef(false);
  const previousUrlQuizIdForDraftModalRef = useRef<string | null | undefined>(undefined);
  const localDraftStorageToastShownRef = useRef(false);
  const serverAutosaveDebounceTimerRef = useRef<number | null>(null);
  const autosaveInFlightRef = useRef(false);
  const serverAutosaveWaitPromiseRef = useRef<Promise<void> | null>(null);
  const autosaveErrorSnapshotRef = useRef<string | null>(null);
  const isSavingRef = useRef(false);
  const isFinalizingDraftRef = useRef(false);
  const [localDraftModalOpen, setLocalDraftModalOpen] = useState(false);
  const [localDraftPayload, setLocalDraftPayload] = useState<BuilderLocalDraftPayload | null>(
    null,
  );
  const [activeSaveStatsModalOpen, setActiveSaveStatsModalOpen] = useState(false);
  const [isStatsModalDraftCopyBusy, setIsStatsModalDraftCopyBusy] = useState(false);
  const pendingConfirmedStatsResetRef = useRef(false);
  const builderMainScrollRef = useRef<HTMLElement | null>(null);
  const finalizeNavigationStartedRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const { showToast } = useToast();
  const {
    setBuilderHasUnsavedChanges,
    runNavigationBypass,
    requestNavigate,
  } = useBuilderNavigationGuard();

  useLayoutEffect(() => {
    quizRef.current = quiz;
    timeLimitUiRef.current = timeLimitUi;
    userIdRef.current = userId;
    urlQuizIdRef.current = urlQuizId;
    savedQuizIdRef.current = savedQuizId;
    serverQuizStatusRef.current = serverQuizStatus;
  }, [quiz, timeLimitUi, userId, urlQuizId, savedQuizId, serverQuizStatus]);

  useLayoutEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  useLayoutEffect(() => {
    isFinalizingDraftRef.current = isFinalizingDraft;
  }, [isFinalizingDraft]);

  const assignBaselineSnapshot = useCallback((snapshot: string, quizForPlayable: QuizBuilder) => {
    unsavedBaselineRef.current = snapshot;
    setBaselineSnapshotForUi(snapshot);
    baselinePlayableMultisetKeyRef.current = buildPlayableContentMultisetKey(quizForPlayable);
  }, []);

  const clearServerAutosaveDebounceTimer = useCallback(() => {
    if (serverAutosaveDebounceTimerRef.current !== null) {
      window.clearTimeout(serverAutosaveDebounceTimerRef.current);
      serverAutosaveDebounceTimerRef.current = null;
    }
  }, []);

  const clearCurrentLocalBuilderDraft = useCallback(() => {
    if (!userId) {
      return;
    }
    const scope = getBuilderDraftStorageScope({ urlQuizId, savedQuizId });
    clearBuilderDraftAndIndexEntry(userId, scope);
  }, [userId, urlQuizId, savedQuizId]);

  const handleDismissLocalDraftModal = useCallback(() => {
    clearCurrentLocalBuilderDraft();
    setLocalDraftModalOpen(false);
    setLocalDraftPayload(null);
  }, [clearCurrentLocalBuilderDraft]);

  const handleRestoreLocalDraft = useCallback(() => {
    if (!localDraftPayload) {
      return;
    }
    setQuiz(localDraftPayload.quiz);
    setTimeLimitUi(localDraftPayload.timeLimitUi);
    clearCurrentLocalBuilderDraft();
    setLocalDraftModalOpen(false);
    setLocalDraftPayload(null);
    showToast(t(locale, "builder.localDraftRestoredToast"), "success");
  }, [localDraftPayload, clearCurrentLocalBuilderDraft, locale, showToast]);

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
    if (previousUrlQuizIdForDraftModalRef.current === undefined) {
      previousUrlQuizIdForDraftModalRef.current = urlQuizId;
      hasCapturedHydratedBaselineForDraftRef.current = false;
      return;
    }
    if (previousUrlQuizIdForDraftModalRef.current === urlQuizId) {
      return;
    }
    hasCapturedHydratedBaselineForDraftRef.current = false;
    queueMicrotask(() => {
      setLocalDraftModalOpen(false);
      setLocalDraftPayload(null);
    });
    previousUrlQuizIdForDraftModalRef.current = urlQuizId;
  }, [urlQuizId]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    if (isLoading) {
      return;
    }
    if (unsavedBaselineRef.current === null) {
      return;
    }

    const wantsRestoreDraft =
      searchParams.get("restoreDraft") === "1" ||
      searchParams.get("restoreDraft") === "true";

    if (wantsRestoreDraft) {
      hasCapturedHydratedBaselineForDraftRef.current = false;
    }

    if (hasCapturedHydratedBaselineForDraftRef.current) {
      return;
    }

    hasCapturedHydratedBaselineForDraftRef.current = true;
    const baseline = unsavedBaselineRef.current;
    const scope = getBuilderDraftStorageScope({
      urlQuizId,
      savedQuizId,
    });
    const key = buildBuilderDraftKey(userId, scope);
    const draft = loadBuilderDraft(key);
    const shouldOpenModal =
      draft !== null &&
      (shouldOfferBuilderLocalDraftRestore(draft, baseline) || wantsRestoreDraft);
    if (shouldOpenModal) {
      setLocalDraftModalOpen(true);
      setLocalDraftPayload(draft);
    }
  }, [userId, isLoading, urlQuizId, savedQuizId, searchParams]);

  useEffect(() => {
    if (!localDraftModalOpen) {
      return;
    }
    const flag = searchParams.get("restoreDraft");
    if (flag !== "1" && flag !== "true") {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("restoreDraft");
    const queryString = params.toString();
    const nextPath = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(nextPath);
  }, [localDraftModalOpen, searchParams, pathname, router]);

  useEffect(() => {
    const urlQuizId = initialQuizId || searchParams.get("quizId");
    if (!urlQuizId && unsavedBaselineRef.current === null) {
      assignBaselineSnapshot(computeQuizBuilderSnapshot(quiz, timeLimitUi), quiz);
    }
  }, [initialQuizId, searchParams, quiz, timeLimitUi, assignBaselineSnapshot]);

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
              settings: mergeQuizSettingsFromStored(result.quiz.settings),
              questions: result.quiz.questions.map((q: { id: string; type: string; label: string; image?: string; imageKey?: string; explanation?: string; options: { id: string; label: string; isCorrect: boolean }[] }) => ({
                id: q.id,
                type: q.type as QuestionType,
                label: q.label,
                image: q.image,
                imageKey: q.imageKey,
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
            setServerQuizStatus(result.quiz.status);
            const loadedTimeLimitUi = deriveTimeLimitUiFromSettings(loadedQuiz.settings);
            setTimeLimitUi(loadedTimeLimitUi);
            assignBaselineSnapshot(
              computeQuizBuilderSnapshot(loadedQuiz, loadedTimeLimitUi),
              loadedQuiz,
            );
          } else {
            setServerQuizStatus(null);
            showToast(result.error || t(locale, "common.error"), "error");
          }
        })
        .catch((error) => {
          console.error("Error loading quiz:", error);
          setServerQuizStatus(null);
          showToast(t(locale, "common.error"), "error");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
    // Do not router.replace to `/builder/${savedQuizId}` here when `savedQuizId` was just
    // set after creating a quiz: it races with `router.push` to `/dashboard/quiz/.../success`
    // and cancels the success redirect. URL sync after save is handled in handleSave when needed.
  }, [initialQuizId, searchParams, savedQuizId, router, locale, showToast, assignBaselineSnapshot]);

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
      const baseline = unsavedBaselineRef.current;
      const currentQuiz = quizRef.current;
      const currentUi = timeLimitUiRef.current;
      const currentUserId = userIdRef.current;
      if (
        currentUserId &&
        baseline !== null &&
        computeQuizBuilderSnapshot(currentQuiz, currentUi) !== baseline
      ) {
        const scope = getBuilderDraftStorageScope({
          urlQuizId: urlQuizIdRef.current,
          savedQuizId: savedQuizIdRef.current,
        });
        const key = buildBuilderDraftKey(currentUserId, scope);
        const sourceRoute =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : pathname;
        saveBuilderDraft(
          key,
          createBuilderLocalDraftPayload({
            quiz: currentQuiz,
            timeLimitUi: currentUi,
            sourceRoute,
          }),
          { userId: currentUserId, scope },
        );
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [quiz, timeLimitUi, pathname]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    const intervalMs = 8000;
    const id = window.setInterval(() => {
      const baseline = unsavedBaselineRef.current;
      if (baseline === null) {
        return;
      }
      const currentQuiz = quizRef.current;
      const currentUi = timeLimitUiRef.current;
      const currentUserId = userIdRef.current;
      if (!currentUserId) {
        return;
      }
      if (computeQuizBuilderSnapshot(currentQuiz, currentUi) === baseline) {
        return;
      }
      const scope = getBuilderDraftStorageScope({
        urlQuizId: urlQuizIdRef.current,
        savedQuizId: savedQuizIdRef.current,
      });
      const key = buildBuilderDraftKey(currentUserId, scope);
      const sourceRoute =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "";
      const result = saveBuilderDraft(
        key,
        createBuilderLocalDraftPayload({
          quiz: currentQuiz,
          timeLimitUi: currentUi,
          sourceRoute,
        }),
        { userId: currentUserId, scope },
      );
      if (!result.ok && !localDraftStorageToastShownRef.current) {
        localDraftStorageToastShownRef.current = true;
        showToast(t(locale, "builder.localDraftStorageWarning"), "warning");
      }
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [userId, locale, showToast]);

  useEffect(() => {
    if (!savedQuizId || isLoading || isSaving || isFinalizingDraft) {
      clearServerAutosaveDebounceTimer();
      return;
    }

    const baseline = unsavedBaselineRef.current;
    if (baseline === null) {
      clearServerAutosaveDebounceTimer();
      return;
    }

    const snapshotNow = computeQuizBuilderSnapshot(quiz, timeLimitUi);
    if (snapshotNow === baseline) {
      clearServerAutosaveDebounceTimer();
      return;
    }

    const mergedForEstimate: QuizBuilder = {
      ...quiz,
      settings: buildQuizSettingsWithResolvedTimeLimit(quiz.settings, timeLimitUi),
    };
    const estimatedBytes = estimateQuizPayloadSize(mergedForEstimate);
    const gate = evaluateServerAutosaveGate({
      savedQuizId,
      quizLifecycleStatus: serverQuizStatus,
      baselineSnapshot: baseline,
      currentSnapshot: snapshotNow,
      quizForValidation: quiz,
      timeLimitUi,
      estimatedPayloadBytes: estimatedBytes,
      autosavePayloadMaxBytes: QUIZ_SAVE_PAYLOAD_WARN_BYTES,
    });
    if (!gate.proceed) {
      clearServerAutosaveDebounceTimer();
      return;
    }

    clearServerAutosaveDebounceTimer();
    serverAutosaveDebounceTimerRef.current = window.setTimeout(() => {
      serverAutosaveDebounceTimerRef.current = null;

      const run = async (): Promise<void> => {
        const snapshotBefore = computeQuizBuilderSnapshot(
          quizRef.current,
          timeLimitUiRef.current,
        );
        const baselineAtFire = unsavedBaselineRef.current;
        if (baselineAtFire === null || snapshotBefore === baselineAtFire) {
          return;
        }
        if (isSavingRef.current || autosaveInFlightRef.current || isFinalizingDraftRef.current) {
          return;
        }

        const qLatest = quizRef.current;
        const uiLatest = timeLimitUiRef.current;
        const sid = savedQuizIdRef.current;
        if (!sid) {
          return;
        }

        const mergedQuiz: QuizBuilder = {
          ...qLatest,
          settings: buildQuizSettingsWithResolvedTimeLimit(qLatest.settings, uiLatest),
        };
        const estimated = estimateQuizPayloadSize(mergedQuiz);
        const gateAtFire = evaluateServerAutosaveGate({
          savedQuizId: sid,
          quizLifecycleStatus: serverQuizStatusRef.current,
          baselineSnapshot: baselineAtFire,
          currentSnapshot: snapshotBefore,
          quizForValidation: qLatest,
          timeLimitUi: uiLatest,
          estimatedPayloadBytes: estimated,
          autosavePayloadMaxBytes: QUIZ_SAVE_PAYLOAD_WARN_BYTES,
        });
        if (!gateAtFire.proceed) {
          return;
        }

        autosaveInFlightRef.current = true;
        setServerSaveUiPhase("autosaving");
        try {
          const result = await saveQuiz(mergedQuiz, sid);
          if (!result.success) {
            autosaveErrorSnapshotRef.current = computeQuizBuilderSnapshot(
              quizRef.current,
              timeLimitUiRef.current,
            );
            setServerSaveUiPhase("autosaveError");
            return;
          }

          const mergedQuizResult: QuizBuilder =
            result.quizId !== undefined ? { ...mergedQuiz, id: result.quizId } : mergedQuiz;
          const normalizedTimeLimitUi = deriveTimeLimitUiFromSettings(mergedQuizResult.settings);
          const snapshotAfterEdit = computeQuizBuilderSnapshot(
            quizRef.current,
            timeLimitUiRef.current,
          );
          if (snapshotAfterEdit !== snapshotBefore) {
            setServerSaveUiPhase("idle");
            return;
          }

          assignBaselineSnapshot(
            computeQuizBuilderSnapshot(mergedQuizResult, normalizedTimeLimitUi),
            mergedQuizResult,
          );
          setQuiz(mergedQuizResult);
          setTimeLimitUi(normalizedTimeLimitUi);
          syncDirtyToGuard();

          const uid = userIdRef.current;
          if (uid) {
            const scopes = new Set<string>();
            if (result.quizId) {
              scopes.add(result.quizId);
            }
            if (savedQuizIdRef.current) {
              scopes.add(savedQuizIdRef.current);
            }
            if (urlQuizIdRef.current) {
              scopes.add(urlQuizIdRef.current);
            }
            for (const scopeRaw of scopes) {
              const scope = scopeRaw === "new" ? "new" : scopeRaw;
              clearBuilderDraftAndIndexEntry(uid, scope);
            }
          }

          setLastServerAutosaveSuccessAt(Date.now());
          setServerSaveUiPhase("autosaveSaved");
        } catch (error) {
          console.error("Error autosaving quiz:", error);
          autosaveErrorSnapshotRef.current = computeQuizBuilderSnapshot(
            quizRef.current,
            timeLimitUiRef.current,
          );
          setServerSaveUiPhase("autosaveError");
        } finally {
          autosaveInFlightRef.current = false;
        }
      };

      const promise = run();
      serverAutosaveWaitPromiseRef.current = promise.finally(() => {
        if (serverAutosaveWaitPromiseRef.current === promise) {
          serverAutosaveWaitPromiseRef.current = null;
        }
      });
      void promise;
    }, SERVER_AUTOSAVE_DEBOUNCE_MS);

    return () => {
      clearServerAutosaveDebounceTimer();
    };
  }, [
    quiz,
    timeLimitUi,
    savedQuizId,
    isLoading,
    isSaving,
    isFinalizingDraft,
    baselineSnapshotForUi,
    clearServerAutosaveDebounceTimer,
    syncDirtyToGuard,
    assignBaselineSnapshot,
    serverQuizStatus,
  ]);

  useEffect(() => {
    if (serverSaveUiPhase !== "autosaveSaved") {
      return;
    }
    const id = window.setTimeout(() => {
      setServerSaveUiPhase("idle");
    }, 3000);
    return () => window.clearTimeout(id);
  }, [serverSaveUiPhase]);

  useEffect(() => {
    if (serverSaveUiPhase !== "autosaveError") {
      return;
    }
    const errSnap = autosaveErrorSnapshotRef.current;
    if (errSnap === null) {
      return;
    }
    const now = computeQuizBuilderSnapshot(quiz, timeLimitUi);
    if (now !== errSnap) {
      setServerSaveUiPhase("idle");
      autosaveErrorSnapshotRef.current = null;
    }
  }, [quiz, timeLimitUi, serverSaveUiPhase]);

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

  const isDirtyVersusBaseline = useMemo(
    () =>
      baselineSnapshotForUi !== null &&
      computeQuizBuilderSnapshot(quiz, timeLimitUi) !== baselineSnapshotForUi,
    [quiz, timeLimitUi, baselineSnapshotForUi],
  );

  const gateProceedsForServerAutosave = useMemo(() => {
    if (!savedQuizId || baselineSnapshotForUi === null) {
      return false;
    }
    const snapshotNow = computeQuizBuilderSnapshot(quiz, timeLimitUi);
    if (snapshotNow === baselineSnapshotForUi) {
      return false;
    }
    const mergedForEstimate: QuizBuilder = {
      ...quiz,
      settings: buildQuizSettingsWithResolvedTimeLimit(quiz.settings, timeLimitUi),
    };
    const estimatedBytes = estimateQuizPayloadSize(mergedForEstimate);
    return evaluateServerAutosaveGate({
      savedQuizId,
      quizLifecycleStatus: serverQuizStatus,
      baselineSnapshot: baselineSnapshotForUi,
      currentSnapshot: snapshotNow,
      quizForValidation: quiz,
      timeLimitUi,
      estimatedPayloadBytes: estimatedBytes,
      autosavePayloadMaxBytes: QUIZ_SAVE_PAYLOAD_WARN_BYTES,
    }).proceed;
  }, [savedQuizId, baselineSnapshotForUi, quiz, timeLimitUi, serverQuizStatus]);

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

    const draftHint = `\n${t(locale, "builder.saveErrorDraftKept")}`;
    clearServerAutosaveDebounceTimer();
    const pendingAutosave = serverAutosaveWaitPromiseRef.current;
    if (pendingAutosave) {
      try {
        await pendingAutosave;
      } catch {
        // Autosave errors are surfaced via the inline status, not here.
      }
    }

    if (
      serverQuizStatus === "ACTIVE" &&
      savedQuizId &&
      isDirtyVersusBaseline &&
      !pendingConfirmedStatsResetRef.current
    ) {
      const warning = await getActiveQuizSaveStatsWarning(savedQuizId);
      if (warning.success && warning.needsWarning) {
        const baselinePlayableKey = baselinePlayableMultisetKeyRef.current;
        const nextPlayableKey = buildPlayableContentMultisetKey(quizToSave);
        if (baselinePlayableKey !== null && nextPlayableKey === baselinePlayableKey) {
          // Metadata/settings-only change: save without modal or stats reset.
        } else {
          setActiveSaveStatsModalOpen(true);
          return;
        }
      }
    }

    const resetRecordedResponses = pendingConfirmedStatsResetRef.current;
    pendingConfirmedStatsResetRef.current = false;

    setIsSaving(true);
    try {
      const isExistingQuiz = isQuizSaved;
      const result = await saveQuiz(
        quizToSave,
        savedQuizId || undefined,
        resetRecordedResponses
          ? { resetRecordedResponsesBeforeUpdate: true }
          : undefined,
      );

      if (result.success) {
        const clearLocalDraftsAfterServerSuccess = (quizIdForKeys: string | undefined) => {
          if (!userId) {
            return;
          }
          const scopes = new Set<string>();
          scopes.add("new");
          if (quizIdForKeys) {
            scopes.add(quizIdForKeys);
          }
          if (savedQuizId) {
            scopes.add(savedQuizId);
          }
          if (urlQuizId) {
            scopes.add(urlQuizId);
          }
          for (const scopeRaw of scopes) {
            const scope = scopeRaw === "new" ? "new" : scopeRaw;
            clearBuilderDraftAndIndexEntry(userId, scope);
          }
        };

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
              randomizeOptions: false,
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
              randomized:
                settings.randomizeQuestions || settings.randomizeOptions,
            });
            setQuiz({ ...quizToSave, id: result.quizId });
            setTimeLimitUi(normalizedTimeLimitUi);
            if (
              shouldRedirectToQuizSuccess({
                isExistingQuiz,
                quizId: result.quizId,
              })
            ) {
              assignBaselineSnapshot(
                computeQuizBuilderSnapshot(mergedQuiz, normalizedTimeLimitUi),
                mergedQuiz,
              );
              clearLocalDraftsAfterServerSuccess(result.quizId);
              setLastServerAutosaveSuccessAt(Date.now());
              setServerSaveUiPhase("idle");
              autosaveErrorSnapshotRef.current = null;
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
        assignBaselineSnapshot(
          computeQuizBuilderSnapshot(mergedQuiz, normalizedTimeLimitUi),
          mergedQuiz,
        );
        syncDirtyToGuard();

        const message = isQuizSaved
          ? t(locale, "builder.quizSaved")
          : t(locale, "builder.quizCreated");

        clearLocalDraftsAfterServerSuccess(result.quizId ?? mergedQuiz.id);
        setLastServerAutosaveSuccessAt(Date.now());
        setServerSaveUiPhase("idle");
        autosaveErrorSnapshotRef.current = null;
        showToast(message, "success");
      } else {
        showToast(`${result.error || t(locale, "builder.saveError")}${draftHint}`, "error");
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      if (isSaveQuizPayloadTooLargeError(error)) {
        showToast(`${t(locale, "builder.saveErrorPayloadTooLarge")}${draftHint}`, "error");
      } else {
        showToast(`${t(locale, "builder.saveError")}${draftHint}`, "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleActiveSaveStatsModalCancel = () => {
    setActiveSaveStatsModalOpen(false);
  };

  const handleActiveSaveStatsModalSaveAsDraftCopy = async () => {
    if (!savedQuizId || !userId) {
      return;
    }

    const timeLimitError = validateBuilderTimeLimit(timeLimitUi);
    const errors = validateQuiz(quiz);
    const mergedErrors = timeLimitError ? [...errors, timeLimitError] : errors;
    if (mergedErrors.length > 0) {
      setValidationErrors(mergedErrors);
      showToast(t(locale, "builder.saveError"), "error");
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

    clearServerAutosaveDebounceTimer();
    const pendingAutosave = serverAutosaveWaitPromiseRef.current;
    if (pendingAutosave) {
      try {
        await pendingAutosave;
      } catch {
        // Autosave errors are surfaced via the inline status, not here.
      }
    }

    setIsStatsModalDraftCopyBusy(true);
    try {
      const copyResult = await saveModifiedQuizAsDraftCopyAction(
        savedQuizId,
        quizToSave,
        locale,
      );
      if (copyResult.success) {
        clearBuilderDraftAndIndexEntry(userId, savedQuizId);
        if (urlQuizId && urlQuizId !== savedQuizId) {
          clearBuilderDraftAndIndexEntry(userId, urlQuizId);
        }

        setActiveSaveStatsModalOpen(false);
        showToast(t(locale, "builder.activeSaveStatsModal.draftCopySuccessToast"), "success");
        runNavigationBypass(() => {
          setBuilderHasUnsavedChanges(false);
          router.push(`/builder/${copyResult.quizId}`);
        });
        return;
      }

      const draftHint = `\n${t(locale, "builder.saveErrorDraftKept")}`;
      showToast(`${copyResult.error || t(locale, "builder.saveError")}${draftHint}`, "error");
    } catch (error) {
      console.error("saveModifiedQuizAsDraftCopyAction from builder:", error);
      showToast(
        `${t(locale, "builder.saveError")}\n${t(locale, "builder.saveErrorDraftKept")}`,
        "error",
      );
    } finally {
      setIsStatsModalDraftCopyBusy(false);
    }
  };

  const handleActiveSaveStatsModalConfirmReset = () => {
    pendingConfirmedStatsResetRef.current = true;
    setActiveSaveStatsModalOpen(false);
    void handleSave();
  };

  const handleFinalizeDraft = async () => {
    if (!savedQuizId) {
      return;
    }

    if (quiz.questions.length === 0) {
      showToast(t(locale, "builder.finalizeAddQuestionFirst"), "error");
      return;
    }

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

    clearServerAutosaveDebounceTimer();
    const pendingAutosave = serverAutosaveWaitPromiseRef.current;
    if (pendingAutosave) {
      try {
        await pendingAutosave;
      } catch {
        // Autosave errors are surfaced via the inline status, not here.
      }
    }

    finalizeNavigationStartedRef.current = false;
    setIsFinalizingDraft(true);
    try {
      const saveResult = await saveQuiz(quizToSave, savedQuizId);
      if (!saveResult.success) {
        showToast(
          `${t(locale, "builder.saveError")}\n${t(locale, "builder.saveErrorDraftKept")}`,
          "error",
        );
        return;
      }

      const finalizeResult = await finalizeDraftQuizAction(savedQuizId);
      if (!finalizeResult.success) {
        showToast(resolveFinalizeDraftQuizError(locale, finalizeResult.error), "error");
        return;
      }

      if (userId) {
        const scopes = new Set<string>();
        scopes.add("new");
        scopes.add(savedQuizId);
        if (urlQuizId) {
          scopes.add(urlQuizId);
        }
        for (const scopeRaw of scopes) {
          const scope = scopeRaw === "new" ? "new" : scopeRaw;
          clearBuilderDraftAndIndexEntry(userId, scope);
        }
      }

      const mergedQuiz: QuizBuilder =
        saveResult.quizId !== undefined ? { ...quizToSave, id: saveResult.quizId } : quizToSave;
      const normalizedTimeLimitUi = deriveTimeLimitUiFromSettings(mergedQuiz.settings);
      setQuiz(mergedQuiz);
      setTimeLimitUi(normalizedTimeLimitUi);
      setServerQuizStatus("ACTIVE");
      assignBaselineSnapshot(
        computeQuizBuilderSnapshot(mergedQuiz, normalizedTimeLimitUi),
        mergedQuiz,
      );
      syncDirtyToGuard();
      showToast(t(locale, "builder.finalizeSuccessToast"), "success");
      setLastServerAutosaveSuccessAt(Date.now());
      setServerSaveUiPhase("idle");
      autosaveErrorSnapshotRef.current = null;

      const finalizeRevealMs = prefersReducedMotion ? 0 : 900;
      if (finalizeRevealMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, finalizeRevealMs));
      }

      finalizeNavigationStartedRef.current = true;
      runNavigationBypass(() => {
        setBuilderHasUnsavedChanges(false);
        router.push(buildQuizSuccessPath(savedQuizId));
      });
    } finally {
      if (!finalizeNavigationStartedRef.current) {
        setIsFinalizingDraft(false);
      }
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

  const localDraftFormattedSavedAt =
    localDraftPayload !== null
      ? new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(localDraftPayload.savedAt))
      : "";

  return (
    <>
      <AlertDialog
        open={localDraftModalOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            handleDismissLocalDraftModal();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(locale, "builder.localDraftModalTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(locale, "builder.localDraftModalDescription", {
                date: localDraftFormattedSavedAt,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={handleDismissLocalDraftModal}
            >
              {t(locale, "builder.localDraftIgnore")}
            </Button>
            <Button
              type="button"
              variant="blue"
              className="w-full sm:w-auto"
              onClick={handleRestoreLocalDraft}
            >
              {t(locale, "builder.localDraftRestore")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={activeSaveStatsModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setActiveSaveStatsModalOpen(false);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t(locale, "builder.activeSaveStatsModal.title")}</DialogTitle>
            <DialogDescription>
              {t(locale, "builder.activeSaveStatsModal.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={handleActiveSaveStatsModalCancel}
            >
              {t(locale, "builder.activeSaveStatsModal.cancel")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => void handleActiveSaveStatsModalSaveAsDraftCopy()}
              disabled={isStatsModalDraftCopyBusy || isSaving}
            >
              {isStatsModalDraftCopyBusy
                ? t(locale, "common.loading")
                : t(locale, "builder.activeSaveStatsModal.saveAsDraftCopy")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={handleActiveSaveStatsModalConfirmReset}
              disabled={isSaving}
            >
              {t(locale, "builder.activeSaveStatsModal.confirmReset")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold h1">{t(locale, "builder.title")}</h1>
                {displayedEditorialStatus !== null ? (
                  <QuizStatusBadge status={displayedEditorialStatus} locale={locale} />
                ) : null}
                {quiz.questions.length > 0 && (
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    {quiz.questions.length} {quiz.questions.length === 1 ? t(locale, "dashboard.question") : t(locale, "dashboard.questions")}
                  </Badge>
                )}
              </div>
              <div className="flex w-full flex-col items-stretch gap-1 sm:w-auto sm:items-end">
                <div className="flex w-full items-center gap-2 sm:w-auto">
                  {serverQuizStatus === "ARCHIVED" ? null : serverQuizStatus === "DRAFT" &&
                    savedQuizId ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleSave}
                        disabled={
                          quiz.questions.length === 0 || isSaving || isFinalizingDraft
                        }
                        className="flex-1 sm:flex-initial text-base relative"
                        size="default"
                      >
                        <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                        {isSaving
                          ? t(locale, "common.loading")
                          : t(locale, "builder.saveNow")}
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
                        variant="blue"
                        onClick={handleFinalizeDraft}
                        disabled={isSaving || isFinalizingDraft}
                        className="flex-1 sm:flex-initial text-base gap-1.5"
                        size="default"
                      >
                        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        {isFinalizingDraft
                          ? t(locale, "builder.finalizingQuiz")
                          : t(locale, "builder.finalizeQuiz")}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="blue"
                      onClick={handleSave}
                      disabled={
                        quiz.questions.length === 0 ||
                        isSaving ||
                        isFinalizingDraft ||
                        (serverQuizStatus === "ACTIVE" && !isDirtyVersusBaseline)
                      }
                      className="flex-1 sm:flex-initial text-base relative"
                      size="default"
                    >
                      <Save className="h-3 w-3 sm:h-4 sm:w-4" />
                      {(() => {
                        if (isSaving) {
                          return t(locale, "common.loading");
                        }
                        if (!isQuizSaved) {
                          return t(locale, "builder.createQuiz");
                        }
                        if (serverQuizStatus === "ACTIVE") {
                          return t(locale, "builder.saveChanges");
                        }
                        return t(locale, "builder.saveQuiz");
                      })()}
                      {validationErrors.length > 0 && (
                        <Badge
                          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground border-destructive"
                        >
                          {validationErrors.length}
                        </Badge>
                      )}
                    </Button>
                  )}
                  {isQuizSaved && savedQuizId && (
                    <QuizMenu
                      quizId={savedQuizId}
                      quizName={quiz.name}
                      quizStatus={serverQuizStatus ?? "DRAFT"}
                      onDeleted={() => {
                        requestNavigate("/dashboard");
                      }}
                    />
                  )}
                </div>
                <BuilderSaveStatus
                  locale={locale}
                  phase={serverSaveUiPhase}
                  savedQuizId={savedQuizId}
                  quizLifecycleStatus={serverQuizStatus}
                  isDirtyVersusBaseline={isDirtyVersusBaseline}
                  quizQuestionCount={quiz.questions.length}
                  gateProceedsForServerAutosave={gateProceedsForServerAutosave}
                  isManualSaving={isSaving || isFinalizingDraft}
                  lastServerAutosaveSuccessAt={
                    isDirtyVersusBaseline ? null : lastServerAutosaveSuccessAt
                  }
                  isLoading={isLoading}
                />
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
                            quizIdForImageUpload={quizIdForImageUpload}
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
      <FullscreenBlockingOverlay
        open={isSaving || isFinalizingDraft}
        title={
          isFinalizingDraft
            ? t(locale, "builder.blockingFinalizeTitle")
            : t(locale, "builder.blockingSaveTitle")
        }
        description={
          isFinalizingDraft
            ? t(locale, "builder.blockingFinalizeDescription")
            : t(locale, "builder.blockingSaveDescription")
        }
      />
    </>
  );
}

