"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
  useMemo,
  type MouseEvent,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Save,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Eye,
} from "lucide-react";
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
import { BuilderMobileOrganizeTabPanel } from "@/components/quiz-builder/builder-mobile-organize-tab-panel";
import { BuilderMobileStickyTabsBar } from "@/components/quiz-builder/builder-mobile-sticky-tabs-bar";
import { BuilderOrganizeQuestionsList } from "@/components/quiz-builder/builder-organize-questions-list";
import { BuilderDesktopSidebar } from "@/components/quiz-builder/builder-desktop-sidebar";
import { BuilderQuizSettingsPanel } from "@/components/quiz-builder/builder-quiz-settings-panel";
import { BuilderQuizSettingsSheet } from "@/components/quiz-builder/builder-quiz-settings-sheet";
import { BuilderDraftSaveSplitButton } from "@/components/quiz-builder/builder-draft-save-split-button";
import { BuilderMobileQuizCard } from "@/components/quiz-builder/builder-mobile-quiz-card";
import { BuilderSaveStatus } from "@/components/quiz-builder/builder-save-status";
import { BuilderSaveErrorReportBanner } from "@/components/builder/builder-save-error-report-banner";
import { useSupportFeedback } from "@/components/support/support-feedback-provider";
import { BuilderBackToTopButton } from "@/components/quiz-builder/builder-back-to-top-button";
import { FullscreenBlockingOverlay } from "@/components/ui/fullscreen-blocking-overlay";
import { useBuilderNavigationGuard } from "@/components/dashboard/builder-navigation-guard-context";
import { resolveMobileQuizOptionsOpenAfterQuestionCountChange } from "@/lib/builder-mobile-quiz-options";
import { DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS } from "@/lib/builder/defaultManualQuizSettings";
import { resolveFinalizeDraftQuizError } from "@/lib/builder/finalizeDraftQuizErrors";
import { estimateQuizPayloadSize } from "@/lib/builder/estimateQuizPayloadSize";
import { isSaveQuizPayloadTooLargeError } from "@/lib/builder/isSaveQuizPayloadTooLargeError";
import {
  buildBuilderSaveErrorMetadata,
  type BuilderSaveErrorPhase,
} from "@/lib/builder/builder-save-error-report";
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
import {
  evaluateServerAutosaveGate,
  isBuilderQuizValidForFinalize,
  SERVER_AUTOSAVE_DEBOUNCE_MS,
} from "@/lib/builder/serverAutosaveGate";
import { shouldShowBuilderSaveStatusRow } from "@/lib/builder/builderSaveStatusRowVisibility";
import { useBuilderSaveStatusDisplayKind } from "@/lib/builder/useBuilderSaveStatusDisplayKind";
import { resolveEffectiveAutoSaveEnabled } from "@/lib/builder/resolveEffectiveAutoSaveEnabled";
import {
  isValidQuizName,
  isUntitledQuizName,
  resolveBuilderQuizNameForEditing,
  resolveQuizDisplayName,
} from "@/lib/quiz/quizNameValidation";
import {
  type DesktopBuilderSelection,
  isQuizUntitledForDesktopSelection,
  resolveActiveQuestionIdAfterQuestionDelete,
  resolveDesktopBuilderSelectionAfterQuestionDelete,
  resolveInitialDesktopActiveQuestionId,
  resolveInitialDesktopBuilderSelection,
} from "@/lib/builder/desktopBuilderSelection";
import {
  isCreateQuizButtonDisabledForNoQuestionsAndClean,
  isDraftServerManualSaveActionDisabled,
  isDraftServerManualSaveBusy,
  isActivePrimarySaveDisabled,
} from "@/lib/builder/builderManualSaveButtonPolicy";
import { computeQuizBuilderSnapshot } from "@/lib/builder/quizBuilderSnapshot";
import { pickDominantVisibleQuestionId } from "@/lib/builder/pickDominantVisibleQuestionId";
import { useMinWidthLg } from "@/lib/builder/useMinWidthLg";
import {
  buildBuilderQuestionErrorIdSet,
  countBuilderValidationProblemAreas,
  findFirstBuilderValidationErrorTarget,
  type BuilderValidationErrorTarget,
} from "@/lib/builder/builderValidationTarget";
import {
  reindexValidationErrorsForQuestions,
  removeValidationErrorsAfterQuestionChange,
  removeValidationErrorsForField,
} from "@/lib/builder/builderValidationErrorFilters";
import { computeBuilderValidationErrors } from "@/lib/builder/computeBuilderValidationErrors";
import { mergeQuizSettingsFromStored } from "@/lib/quiz/mergeQuizSettingsFromStored";
import type { BuilderServerSaveUiPhase } from "@/lib/builder/builderSaveStatusDisplay";
import {
  buildQuizToSaveFromBuilderState,
  canProceedWithBuilderSave,
  collectBuilderSaveValidationErrors,
  mergeBaselineAfterPartialSave,
} from "@/lib/builder/builderQuizSavePrep";
import { buildQuizPreviewPath } from "@/lib/quiz/quiz-preview-routes";

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
  errors: ValidationError[];
  quizIdForImageUpload: string | null;
  isNewlyAdded?: boolean;
  isRemoving?: boolean;
  isNavActive?: boolean;
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
  isNavActive = false,
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
        "relative group w-full min-w-0 rounded-lg p-0",
        index % 2 === 0 ? "bg-background" : "bg-muted/30",
        isNewlyAdded && "animate-question-appear",
        isRemoving && "animate-question-remove pointer-events-none",
        isNavActive && "ring-2 ring-inset ring-blue/45",
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
  const { openSupportFeedback } = useSupportFeedback();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [quiz, setQuiz] = useState<QuizBuilder>(() => getInitialQuiz());
  const [timeLimitUi, setTimeLimitUi] = useState<BuilderTimeLimitUi>(() =>
    deriveTimeLimitUiFromSettings(getInitialQuiz().settings),
  );
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [shouldValidateBuilderLive, setShouldValidateBuilderLive] = useState(false);
  const [quizSettingsSheetOpen, setQuizSettingsSheetOpen] = useState(false);
  const previousQuestionCountRef = useRef(quiz.questions.length);
  const [newlyAddedQuestionId, setNewlyAddedQuestionId] = useState<string | null>(null);
  const [removingQuestionId, setRemovingQuestionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [previewReadyQuizId, setPreviewReadyQuizId] = useState<string | null>(null);
  const [isFinalizingDraft, setIsFinalizingDraft] = useState(false);
  const [baselineSnapshotForUi, setBaselineSnapshotForUi] = useState<string | null>(null);
  const [serverSaveUiPhase, setServerSaveUiPhase] = useState<BuilderServerSaveUiPhase>("idle");
  const [saveErrorReport, setSaveErrorReport] = useState<{
    phase: BuilderSaveErrorPhase;
    errorMessage?: string;
    errorCode?: string;
  } | null>(null);
  const [lastServerAutosaveSuccessAt, setLastServerAutosaveSuccessAt] = useState<number | null>(
    null,
  );
  const [savedQuizId, setSavedQuizId] = useState<string | null>(null);
  const [serverQuizStatus, setServerQuizStatus] = useState<QuizLifecycleStatus | null>(null);
  const serverQuizStatusRef = useRef<QuizLifecycleStatus | null>(null);
  const quizIdForImageUpload = savedQuizId ?? urlQuizId ?? null;
  const displayedEditorialStatus = urlQuizId ? serverQuizStatus : null;
  const [builderViewMode, setBuilderViewMode] = useState<BuilderViewMode>("edit");
  const [organizePanelAnimationKey, setOrganizePanelAnimationKey] = useState(0);
  const [scrollToQuestionId, setScrollToQuestionId] = useState<string | null>(null);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [desktopBuilderSelection, setDesktopBuilderSelection] =
    useState<DesktopBuilderSelection>({ view: "settings" });
  const desktopSelectionQuizKeyRef = useRef<string | null>(null);
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
  const [finalizeDraftConfirmOpen, setFinalizeDraftConfirmOpen] = useState(false);
  const [isStatsModalDraftCopyBusy, setIsStatsModalDraftCopyBusy] = useState(false);
  const pendingConfirmedStatsResetRef = useRef(false);
  const pendingPreviewAfterSaveRef = useRef(false);
  const builderMainScrollRef = useRef<HTMLDivElement | null>(null);
  const intersectionRatiosRef = useRef<Map<string, number>>(new Map());
  /** Pins activeQuestionId while a sidebar-driven smooth scroll is in flight. */
  const navScrollLockQuestionIdRef = useRef<string | null>(null);
  const navScrollUnlockTimerRef = useRef<number | null>(null);
  const finalizeNavigationStartedRef = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const isLargeViewport = useMinWidthLg();
  const isDesktopQuestionsCanvasActive =
    isLargeViewport &&
    desktopBuilderSelection.view === "questions" &&
    quiz.questions.length > 0;
  const isEditorScrollTrackingActive =
    isDesktopQuestionsCanvasActive || (!isLargeViewport && builderViewMode === "edit");
  const { showToast } = useToast();
  const {
    setBuilderHasUnsavedChanges,
    runNavigationBypass,
    requestNavigate,
    interceptLinkClick,
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

  const applyServerSaveBaseline = useCallback(
    (
      quizState: QuizBuilder,
      previousBaseline: string | null,
      saveFlags: { savedMetadata: boolean; savedQuestions: boolean },
    ): BuilderTimeLimitUi => {
      const normalizedTimeLimitUi = deriveTimeLimitUiFromSettings(quizState.settings);
      const nextBaseline =
        previousBaseline !== null
          ? mergeBaselineAfterPartialSave({
              previousBaselineSnapshot: previousBaseline,
              currentQuiz: quizState,
              currentTimeLimitUi: normalizedTimeLimitUi,
              savedMetadata: saveFlags.savedMetadata,
              savedQuestions: saveFlags.savedQuestions,
            })
          : computeQuizBuilderSnapshot(quizState, normalizedTimeLimitUi);
      assignBaselineSnapshot(nextBaseline, quizState);
      return normalizedTimeLimitUi;
    },
    [assignBaselineSnapshot],
  );

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

  const clearNavScrollLock = useCallback(() => {
    navScrollLockQuestionIdRef.current = null;
    if (navScrollUnlockTimerRef.current !== null) {
      window.clearTimeout(navScrollUnlockTimerRef.current);
      navScrollUnlockTimerRef.current = null;
    }
  }, []);

  const beginDesktopNavScrollToQuestion = useCallback((questionId: string) => {
    navScrollLockQuestionIdRef.current = questionId;
    if (navScrollUnlockTimerRef.current !== null) {
      window.clearTimeout(navScrollUnlockTimerRef.current);
    }
    navScrollUnlockTimerRef.current = window.setTimeout(() => {
      navScrollLockQuestionIdRef.current = null;
      navScrollUnlockTimerRef.current = null;
    }, 900);
    setDesktopBuilderSelection({ view: "questions" });
    setActiveQuestionId(questionId);
    setScrollToQuestionId(questionId);
  }, []);

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
    if (!isLargeViewport) {
      return;
    }
    if (hasQuizOptionsPanelErrors(validationErrors)) {
      setDesktopBuilderSelection({ view: "settings" });
    }
  }, [isLargeViewport, validationErrors]);

  const untitledQuizDisplayName = t(locale, "builder.defaultDraftName");
  const hasValidQuizTitle = isValidQuizName(quiz.name);
  const isQuizTitleUntitled = isUntitledQuizName(quiz.name);
  const quizNameForEditing = resolveBuilderQuizNameForEditing(quiz.name);
  const shouldAutoFocusQuizNameField =
    isLargeViewport && desktopBuilderSelection.view === "settings" && isQuizTitleUntitled;

  useEffect(() => {
    if (!isLargeViewport || isLoading) {
      return;
    }
    const quizKey = savedQuizId ?? urlQuizId ?? "new";
    if (desktopSelectionQuizKeyRef.current === quizKey) {
      return;
    }
    desktopSelectionQuizKeyRef.current = quizKey;
    const initialSelection = resolveInitialDesktopBuilderSelection({
      quizName: quiz.name,
      questions: quiz.questions,
    });
    setDesktopBuilderSelection(initialSelection);
    setActiveQuestionId(resolveInitialDesktopActiveQuestionId(quiz.questions));
  }, [
    isLargeViewport,
    isLoading,
    quiz.name,
    quiz.questions,
    savedQuizId,
    urlQuizId,
  ]);

  const questionErrorIds = useMemo(
    () => buildBuilderQuestionErrorIdSet(validationErrors, quiz.questions),
    [validationErrors, quiz.questions],
  );
  const validationProblemAreaCount = useMemo(
    () => countBuilderValidationProblemAreas(validationErrors, quiz.questions),
    [validationErrors, quiz.questions],
  );

  const builderSettingsPanelHasError = hasQuizOptionsPanelErrors(validationErrors);

  const isHeaderTitleUntitled = isQuizUntitledForDesktopSelection(quiz.name);
  const builderHeaderDisplayTitle = resolveQuizDisplayName(
    quiz.name,
    untitledQuizDisplayName,
  );

  const scrollToBuilderValidationTarget = useCallback(
    (target: BuilderValidationErrorTarget) => {
      const tryFocus = (element: HTMLElement) => {
        if (
          element instanceof HTMLInputElement ||
          element instanceof HTMLTextAreaElement ||
          element instanceof HTMLSelectElement
        ) {
          element.focus({ preventScroll: true });
        }
      };

      const scrollToElement = (element: HTMLElement) => {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        tryFocus(element);
      };

      const findAfterPaint = (
        select: () => HTMLElement | null,
        onFound: (el: HTMLElement) => void,
        opts: { delayMs?: number } = {},
      ) => {
        const run = () => {
          const el = select();
          if (el) {
            onFound(el);
          }
        };
        if (opts.delayMs && opts.delayMs > 0) {
          window.setTimeout(run, opts.delayMs);
          return;
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(run);
        });
      };

      if (target.type === "quiz-name" || target.type === "quiz-settings") {
        if (isLargeViewport) {
          setDesktopBuilderSelection({ view: "settings" });
          findAfterPaint(
            () =>
              document.querySelector<HTMLElement>(
                target.type === "quiz-name"
                  ? '[data-builder-error-target="quiz-name"]'
                  : '[data-builder-error-target="quiz-settings"]',
              ),
            scrollToElement,
          );
          return;
        }
        setQuizSettingsSheetOpen(true);
        findAfterPaint(
          () =>
            document.querySelector<HTMLElement>(
              target.type === "quiz-name"
                ? '[data-builder-error-target="quiz-name"]'
                : '[data-builder-error-target="quiz-settings"]',
            ),
          scrollToElement,
          { delayMs: 250 },
        );
        return;
      }

      if (isLargeViewport) {
        beginDesktopNavScrollToQuestion(target.questionId);
        return;
      }

      setBuilderViewMode("edit");
      // Reuse the existing scrollToQuestionId effect: it waits for the tab/edit
      // mode to mount the target card before calling scrollIntoView.
      setScrollToQuestionId(target.questionId);
    },
    [beginDesktopNavScrollToQuestion, isLargeViewport],
  );

  const focusQuizNameField = useCallback(() => {
    const focusElement = (element: HTMLElement) => {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      if (
        element instanceof HTMLInputElement ||
        element instanceof HTMLTextAreaElement ||
        element instanceof HTMLSelectElement
      ) {
        element.focus({ preventScroll: true });
      }
    };

    if (isLargeViewport) {
      setDesktopBuilderSelection({ view: "settings" });
    }

    const findAndFocus = () => {
      const element =
        document.getElementById("builder-quiz-name-panel") ??
        document.querySelector<HTMLElement>('[data-builder-error-target="quiz-name"]');
      if (element) {
        focusElement(element);
      }
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(findAndFocus);
    });
  }, [isLargeViewport]);

  const handleValidationFailedSave = useCallback(
    (errors: ValidationError[]) => {
      setValidationErrors(errors);
      setShouldValidateBuilderLive(true);
      const target = findFirstBuilderValidationErrorTarget(errors, quiz.questions);
      if (target) {
        scrollToBuilderValidationTarget(target);
      }
    },
    [quiz.questions, scrollToBuilderValidationTarget],
  );

  const resetBuilderValidationState = useCallback(() => {
    setShouldValidateBuilderLive(false);
    setValidationErrors([]);
  }, []);

  // Live validation: only after the user attempted a save/finalize that failed.
  // Before that, the builder never shows red — see "no blame at first" UX rule.
  useEffect(() => {
    if (!shouldValidateBuilderLive) {
      return;
    }
    setValidationErrors(computeBuilderValidationErrors(quiz, timeLimitUi));
  }, [shouldValidateBuilderLive, quiz, timeLimitUi]);

  useEffect(() => {
    if (isLargeViewport) {
      previousQuestionCountRef.current = quiz.questions.length;
      return;
    }
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
        setQuizSettingsSheetOpen(resolved);
      }
    }
    previousQuestionCountRef.current = nextCount;
  }, [quiz.questions.length, validationErrors, isLargeViewport]);

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

    if (serverQuizStatus === "DRAFT" && !resolveEffectiveAutoSaveEnabled(quiz.settings)) {
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
            setSaveErrorReport({ phase: "autosave", errorMessage: result.error });
            return;
          }

          const mergedQuizResult: QuizBuilder =
            result.quizId !== undefined ? { ...mergedQuiz, id: result.quizId } : mergedQuiz;
          const snapshotAfterEdit = computeQuizBuilderSnapshot(
            quizRef.current,
            timeLimitUiRef.current,
          );
          if (snapshotAfterEdit !== snapshotBefore) {
            setServerSaveUiPhase("idle");
            return;
          }

          const normalizedTimeLimitUi = applyServerSaveBaseline(
            mergedQuizResult,
            baselineAtFire,
            {
              savedMetadata: result.savedMetadata,
              savedQuestions: result.savedQuestions,
            },
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
          setSaveErrorReport({
            phase: "autosave",
            errorMessage: error instanceof Error ? error.message : undefined,
            errorCode: isSaveQuizPayloadTooLargeError(error) ? "PAYLOAD_TOO_LARGE" : undefined,
          });
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
    applyServerSaveBaseline,
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
    if (!isEditorScrollTrackingActive || scrollToQuestionId === null) {
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
  }, [isEditorScrollTrackingActive, scrollToQuestionId]);

  useEffect(() => {
    if (!isDesktopQuestionsCanvasActive) {
      return;
    }
    const root = builderMainScrollRef.current;
    if (!root) {
      return;
    }
    const onScrollEnd = () => {
      clearNavScrollLock();
    };
    root.addEventListener("scrollend", onScrollEnd);
    return () => root.removeEventListener("scrollend", onScrollEnd);
  }, [clearNavScrollLock, isDesktopQuestionsCanvasActive]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") {
      return;
    }
    if (!isEditorScrollTrackingActive || quiz.questions.length === 0) {
      return;
    }
    const root = builderMainScrollRef.current;
    if (!root) {
      return;
    }

    const orderedIds = quiz.questions.map((q) => q.id);
    intersectionRatiosRef.current = new Map();

    const thresholds = Array.from({ length: 21 }, (_, i) => i / 20) as number[];

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const match = /^builder-question-(.+)$/.exec(entry.target.id);
          if (match?.[1]) {
            intersectionRatiosRef.current.set(match[1], entry.intersectionRatio);
          }
        }
        const next = pickDominantVisibleQuestionId(intersectionRatiosRef.current, orderedIds);
        if (navScrollLockQuestionIdRef.current !== null) {
          return;
        }
        setActiveQuestionId(next);
      },
      {
        root,
        rootMargin: "-10% 0px -38% 0px",
        threshold: thresholds,
      },
    );

    let cancelled = false;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }
        for (const id of orderedIds) {
          const el = document.getElementById(`builder-question-${id}`);
          if (el) {
            observer.observe(el);
          }
        }
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      observer.disconnect();
    };
  }, [isEditorScrollTrackingActive, quiz.questions]);

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

  const canFinalizeDraftQuiz = useMemo(
    () => isBuilderQuizValidForFinalize(quiz, timeLimitUi),
    [quiz, timeLimitUi],
  );

  const builderSaveStatusKind = useBuilderSaveStatusDisplayKind({
    phase: serverSaveUiPhase,
    savedQuizId,
    quizLifecycleStatus: serverQuizStatus,
    isDirtyVersusBaseline,
    quizQuestionCount: quiz.questions.length,
    gateProceedsForServerAutosave,
    isManualSaving: isSaving || isFinalizingDraft,
    lastServerAutosaveSuccessAt: isDirtyVersusBaseline ? null : lastServerAutosaveSuccessAt,
  });

  const showSaveErrorReportBanner =
    saveErrorReport !== null || serverSaveUiPhase === "autosaveError";

  const clearSaveErrorReport = useCallback(() => {
    setSaveErrorReport(null);
  }, []);

  const recordSaveFailure = useCallback(
    (phase: BuilderSaveErrorPhase, errorMessage?: string, errorCode?: string) => {
      setSaveErrorReport({ phase, errorMessage, errorCode });
    },
    [],
  );

  const openSaveErrorSupportReport = useCallback(() => {
    const phase = saveErrorReport?.phase ?? "autosave";
    const quizForEstimate: QuizBuilder = {
      ...quiz,
      settings: buildQuizSettingsWithResolvedTimeLimit(quiz.settings, timeLimitUi),
    };

    openSupportFeedback({
      type: "SAVE_ERROR_REPORT",
      quizId: savedQuizId ?? urlQuizId ?? undefined,
      metadata: buildBuilderSaveErrorMetadata({
        phase,
        locale,
        pathname: pathname || "/builder",
        quizId: quiz.id,
        savedQuizId,
        urlQuizId,
        quizStatus: serverQuizStatus,
        questionCount: quiz.questions.length,
        errorMessage: saveErrorReport?.errorMessage,
        errorCode: saveErrorReport?.errorCode,
        payloadSizeBytes: estimateQuizPayloadSize(quizForEstimate),
        isDraft: serverQuizStatus === "DRAFT",
        isActive: serverQuizStatus === "ACTIVE",
      }),
    });
  }, [
    locale,
    openSupportFeedback,
    pathname,
    quiz,
    saveErrorReport,
    savedQuizId,
    serverQuizStatus,
    timeLimitUi,
    urlQuizId,
  ]);

  const saveErrorReportBanner = showSaveErrorReportBanner ? (
    <BuilderSaveErrorReportBanner
      locale={locale}
      onReportIssue={openSaveErrorSupportReport}
      className="mt-2"
    />
  ) : null;

  const showPreviewReadyDialog = useCallback(
    (quizId: string) => {
      setPreviewReadyQuizId(quizId);
      setBuilderHasUnsavedChanges(false);
    },
    [setBuilderHasUnsavedChanges],
  );

  const dismissPreviewReadyDialog = useCallback(() => {
    setPreviewReadyQuizId(null);
  }, []);

  const awaitPendingAutosaveBeforeManualAction = useCallback(async () => {
    clearServerAutosaveDebounceTimer();
    const pendingAutosave = serverAutosaveWaitPromiseRef.current;
    if (pendingAutosave) {
      try {
        await pendingAutosave;
      } catch {
        // Autosave errors are surfaced via the inline status, not here.
      }
    }
  }, [clearServerAutosaveDebounceTimer]);

  const confirmHeavyQuizPayloadIfNeeded = useCallback(
    (quizToSave: QuizBuilder) => {
      const estimatedBytes = estimateQuizPayloadSize(quizToSave);
      if (estimatedBytes >= QUIZ_SAVE_PAYLOAD_WARN_BYTES) {
        return window.confirm(t(locale, "builder.savePayloadHeavyConfirm"));
      }
      return true;
    },
    [locale],
  );

  const shouldShowActiveStatsModalBeforePersist = useCallback(
    async (quizToSave: QuizBuilder) => {
      if (
        serverQuizStatus !== "ACTIVE" ||
        !savedQuizId ||
        !isDirtyVersusBaseline ||
        pendingConfirmedStatsResetRef.current
      ) {
        return false;
      }

      const warning = await getActiveQuizSaveStatsWarning(savedQuizId);
      if (!warning.success || !warning.needsWarning) {
        return false;
      }

      const baselinePlayableKey = baselinePlayableMultisetKeyRef.current;
      const nextPlayableKey = buildPlayableContentMultisetKey(quizToSave);
      if (baselinePlayableKey !== null && nextPlayableKey === baselinePlayableKey) {
        return false;
      }

      return true;
    },
    [isDirtyVersusBaseline, savedQuizId, serverQuizStatus],
  );

  const applyManualSaveSuccessState = useCallback(
    (
      quizToSave: QuizBuilder,
      resultQuizId: string | undefined,
      saveFlags: { savedMetadata: boolean; savedQuestions: boolean } = {
        savedMetadata: true,
        savedQuestions: true,
      },
    ) => {
      const mergedQuiz: QuizBuilder =
        resultQuizId !== undefined ? { ...quizToSave, id: resultQuizId } : quizToSave;

      if (resultQuizId) {
        setSavedQuizId(resultQuizId);
      }

      const normalizedTimeLimitUi = applyServerSaveBaseline(
        mergedQuiz,
        unsavedBaselineRef.current,
        saveFlags,
      );
      setQuiz(mergedQuiz);
      setTimeLimitUi(normalizedTimeLimitUi);
      syncDirtyToGuard();

      if (userId) {
        const scopes = new Set<string>(["new"]);
        if (resultQuizId) {
          scopes.add(resultQuizId);
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
      }

      setLastServerAutosaveSuccessAt(Date.now());
      setServerSaveUiPhase("idle");
      autosaveErrorSnapshotRef.current = null;
      resetBuilderValidationState();
      clearSaveErrorReport();
    },
    [
      applyServerSaveBaseline,
      clearSaveErrorReport,
      resetBuilderValidationState,
      savedQuizId,
      syncDirtyToGuard,
      urlQuizId,
      userId,
    ],
  );

  const handlePreviewQuiz = async () => {
    if (isPreparingPreview || isSaving || isFinalizingDraft) {
      return;
    }

    const mergedErrors = collectBuilderSaveValidationErrors(quiz, timeLimitUi);
    if (mergedErrors.length > 0) {
      handleValidationFailedSave(mergedErrors);
      showToast(t(locale, "builder.previewRequiresSaveError"), "error");
      return;
    }

    const quizToSave = buildQuizToSaveFromBuilderState(quiz, timeLimitUi);
    if (!confirmHeavyQuizPayloadIfNeeded(quizToSave)) {
      return;
    }

    await awaitPendingAutosaveBeforeManualAction();

    const existingQuizId = savedQuizId ?? urlQuizId ?? null;
    const needsPersist = !existingQuizId || isDirtyVersusBaseline;

    if (needsPersist && (await shouldShowActiveStatsModalBeforePersist(quizToSave))) {
      pendingPreviewAfterSaveRef.current = true;
      setActiveSaveStatsModalOpen(true);
      return;
    }

    if (!needsPersist && existingQuizId) {
      showPreviewReadyDialog(existingQuizId);
      return;
    }

    const draftHint = `\n${t(locale, "builder.saveErrorDraftKept")}`;
    const resetRecordedResponses = pendingConfirmedStatsResetRef.current;
    pendingConfirmedStatsResetRef.current = false;

    setIsPreparingPreview(true);
    try {
      const result = await saveQuiz(
        quizToSave,
        savedQuizId || undefined,
        resetRecordedResponses
          ? { resetRecordedResponsesBeforeUpdate: true }
          : undefined,
      );

      if (!result.success) {
        recordSaveFailure("manual_save", result.error);
        showToast(
          `${result.error || t(locale, "builder.previewRequiresSaveError")}${draftHint}`,
          "error",
        );
        return;
      }

      const finalQuizId = result.quizId ?? savedQuizId ?? urlQuizId ?? null;
      if (!finalQuizId) {
        showToast(t(locale, "builder.previewRequiresSaveError"), "error");
        return;
      }

      if (!isQuizSaved && result.quizId) {
        const settings = quizToSave.settings ?? DEFAULT_MANUAL_QUIZ_BUILDER_SETTINGS;
        track(QUIZ_CREATED, {
          ...buildCommonEventProps({
            isLoggedIn: true,
            preferredLanguage: locale,
          }),
          quiz_id: result.quizId,
          source: "builder",
          visibility: quizToSave.visibility,
          question_count: quizToSave.questions.length,
          has_time_limit:
            settings.timeLimitPerQuestion != null && settings.timeLimitPerQuestion > 0,
          show_answer_immediately: settings.showAnswerImmediately,
          randomized: settings.randomizeQuestions || settings.randomizeOptions,
        });
      }

      applyManualSaveSuccessState(quizToSave, result.quizId ?? finalQuizId, {
        savedMetadata: result.savedMetadata,
        savedQuestions: result.savedQuestions,
      });
      showPreviewReadyDialog(finalQuizId);
    } catch (error) {
      console.error("Error preparing preview:", error);
      if (isSaveQuizPayloadTooLargeError(error)) {
        recordSaveFailure(
          "manual_save",
          error instanceof Error ? error.message : undefined,
          "PAYLOAD_TOO_LARGE",
        );
        showToast(`${t(locale, "builder.saveErrorPayloadTooLarge")}${draftHint}`, "error");
      } else {
        recordSaveFailure(
          "manual_save",
          error instanceof Error ? error.message : undefined,
        );
        showToast(`${t(locale, "builder.previewRequiresSaveError")}${draftHint}`, "error");
      }
    } finally {
      setIsPreparingPreview(false);
    }
  };

  const handleSave = async () => {
    const snapshotNow = computeQuizBuilderSnapshot(quiz, timeLimitUi);
    const baselineNow = unsavedBaselineRef.current;
    const isDirtyVersusBaselineNow =
      baselineNow !== null && snapshotNow !== baselineNow;

    if (
      isDirtyVersusBaselineNow &&
      !canProceedWithBuilderSave({
        quiz,
        timeLimitUi,
        baselineSnapshot: baselineNow,
        currentSnapshot: snapshotNow,
      })
    ) {
      handleValidationFailedSave(collectBuilderSaveValidationErrors(quiz, timeLimitUi));
      return;
    }

    const quizToSave = buildQuizToSaveFromBuilderState(quiz, timeLimitUi);

    if (!confirmHeavyQuizPayloadIfNeeded(quizToSave)) {
      return;
    }

    const draftHint = `\n${t(locale, "builder.saveErrorDraftKept")}`;
    await awaitPendingAutosaveBeforeManualAction();

    if (await shouldShowActiveStatsModalBeforePersist(quizToSave)) {
      setActiveSaveStatsModalOpen(true);
      return;
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

        if (result.quizId) {
          setSavedQuizId(result.quizId);
          // Update quiz ID if it was a new quiz
          if (!isQuizSaved && result.quizId) {
            const settings = mergedQuiz.settings ?? {
              showAnswerImmediately: false,
              showAnswersAtEnd: true,
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
            setTimeLimitUi(deriveTimeLimitUiFromSettings(mergedQuiz.settings));
            if (
              shouldRedirectToQuizSuccess({
                isExistingQuiz,
                quizId: result.quizId,
              })
            ) {
              applyServerSaveBaseline(mergedQuiz, unsavedBaselineRef.current, {
                savedMetadata: result.savedMetadata,
                savedQuestions: result.savedQuestions,
              });
              clearLocalDraftsAfterServerSuccess(result.quizId);
              setLastServerAutosaveSuccessAt(Date.now());
              setServerSaveUiPhase("idle");
              autosaveErrorSnapshotRef.current = null;
              clearSaveErrorReport();
              resetBuilderValidationState();
              runNavigationBypass(() => {
                setBuilderHasUnsavedChanges(false);
                router.push(buildQuizSuccessPath(result.quizId));
              });
              return;
            }
          }
        }

        const normalizedTimeLimitUi = applyServerSaveBaseline(
          mergedQuiz,
          unsavedBaselineRef.current,
          {
            savedMetadata: result.savedMetadata,
            savedQuestions: result.savedQuestions,
          },
        );
        setQuiz(mergedQuiz);
        setTimeLimitUi(normalizedTimeLimitUi);
        syncDirtyToGuard();

        const message = isQuizSaved
          ? t(locale, "builder.quizSaved")
          : t(locale, "builder.quizCreated");

        clearLocalDraftsAfterServerSuccess(result.quizId ?? mergedQuiz.id);
        setLastServerAutosaveSuccessAt(Date.now());
        setServerSaveUiPhase("idle");
        autosaveErrorSnapshotRef.current = null;
        resetBuilderValidationState();
        clearSaveErrorReport();
        showToast(message, "success");
      } else {
        recordSaveFailure("manual_save", result.error);
        showToast(`${result.error || t(locale, "builder.saveError")}${draftHint}`, "error");
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      if (isSaveQuizPayloadTooLargeError(error)) {
        recordSaveFailure(
          "manual_save",
          error instanceof Error ? error.message : undefined,
          "PAYLOAD_TOO_LARGE",
        );
        showToast(`${t(locale, "builder.saveErrorPayloadTooLarge")}${draftHint}`, "error");
      } else {
        recordSaveFailure(
          "manual_save",
          error instanceof Error ? error.message : undefined,
        );
        showToast(`${t(locale, "builder.saveError")}${draftHint}`, "error");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleActiveSaveStatsModalCancel = () => {
    pendingPreviewAfterSaveRef.current = false;
    setActiveSaveStatsModalOpen(false);
  };

  const handleActiveSaveStatsModalSaveAsDraftCopy = async () => {
    if (!savedQuizId || !userId) {
      return;
    }

    const wantsPreviewAfter = pendingPreviewAfterSaveRef.current;

    const timeLimitError = validateBuilderTimeLimit(timeLimitUi);
    const errors = validateQuiz(quiz);
    const mergedErrors = timeLimitError ? [...errors, timeLimitError] : errors;
    if (mergedErrors.length > 0) {
      handleValidationFailedSave(mergedErrors);
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
        resetBuilderValidationState();
        if (wantsPreviewAfter) {
          pendingPreviewAfterSaveRef.current = false;
          showToast(t(locale, "builder.activeSaveStatsModal.draftCopySuccessToast"), "success");
          showPreviewReadyDialog(copyResult.quizId);
          return;
        }

        showToast(t(locale, "builder.activeSaveStatsModal.draftCopySuccessToast"), "success");
        runNavigationBypass(() => {
          setBuilderHasUnsavedChanges(false);
          router.push(`/builder/${copyResult.quizId}`);
        });
        return;
      }

      const draftHint = `\n${t(locale, "builder.saveErrorDraftKept")}`;
      recordSaveFailure("save_as_draft_copy", copyResult.error);
      showToast(`${copyResult.error || t(locale, "builder.saveError")}${draftHint}`, "error");
    } catch (error) {
      console.error("saveModifiedQuizAsDraftCopyAction from builder:", error);
      recordSaveFailure(
        "save_as_draft_copy",
        error instanceof Error ? error.message : undefined,
        isSaveQuizPayloadTooLargeError(error) ? "PAYLOAD_TOO_LARGE" : undefined,
      );
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
    if (pendingPreviewAfterSaveRef.current) {
      pendingPreviewAfterSaveRef.current = false;
      void handlePreviewQuiz();
      return;
    }
    void handleSave();
  };

  const handleFinalizeDraft = async () => {
    if (!savedQuizId) {
      return;
    }

    if (isFinalizingDraftRef.current) {
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
      handleValidationFailedSave(mergedErrors);
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
        recordSaveFailure("finalize", saveResult.error);
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
      resetBuilderValidationState();
      showToast(t(locale, "builder.finalizeSuccessToast"), "success");
      setLastServerAutosaveSuccessAt(Date.now());
      setServerSaveUiPhase("idle");
      autosaveErrorSnapshotRef.current = null;
      clearSaveErrorReport();

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
    if (isQuizTitleUntitled) {
      focusQuizNameField();
      return;
    }

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
    if (isLargeViewport) {
      beginDesktopNavScrollToQuestion(newQuestion.id);
    }
  };

  const handleEditQuestionFromOrganize = (questionId: string) => {
    if (isLargeViewport) {
      beginDesktopNavScrollToQuestion(questionId);
      return;
    }
    setBuilderViewMode("edit");
    setScrollToQuestionId(questionId);
  };

  const handleNavigatorQuestionClick = useCallback(
    (questionId: string) => {
      if (isLargeViewport) {
        beginDesktopNavScrollToQuestion(questionId);
        return;
      }
      setBuilderViewMode("edit");
      setScrollToQuestionId(questionId);
    },
    [beginDesktopNavScrollToQuestion, isLargeViewport],
  );

  const handleDesktopSettingsClick = useCallback(() => {
    setDesktopBuilderSelection({ view: "settings" });
  }, []);

  const builderTabsValue = isLargeViewport ? "edit" : builderViewMode;

  const handleQuestionChange = (index: number, updatedQuestion: Question) => {
    const previousQuestion = quiz.questions[index];
    const newQuestions = [...quiz.questions];
    newQuestions[index] = updatedQuestion;
    setQuiz({
      ...quiz,
      questions: newQuestions,
    });
    if (previousQuestion) {
      setValidationErrors((prev) =>
        removeValidationErrorsAfterQuestionChange(
          prev,
          index,
          previousQuestion,
          updatedQuestion,
        ),
      );
    }
  };

  const handleDeleteQuestion = (index: number) => {
    const questionId = quiz.questions[index]?.id;
    if (!questionId) return;

    setRemovingQuestionId(questionId);
  };

  const commitDeleteQuestion = (questionId: string) => {
    const previousQuestions = quiz.questions;
    const newQuestions = previousQuestions.filter((q) => q.id !== questionId);
    setRemovingQuestionId(null);
    setQuiz({
      ...quiz,
      questions: newQuestions,
    });
    setValidationErrors((prev) =>
      reindexValidationErrorsForQuestions(prev, previousQuestions, newQuestions),
    );
    if (isLargeViewport) {
      setDesktopBuilderSelection((current) =>
        resolveDesktopBuilderSelectionAfterQuestionDelete(current, newQuestions),
      );
      setActiveQuestionId((current) =>
        resolveActiveQuestionIdAfterQuestionDelete(
          current,
          questionId,
          previousQuestions,
          newQuestions,
        ),
      );
    }
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === quiz.questions.length - 1)
    ) {
      return;
    }

    const previousQuestions = quiz.questions;
    const newQuestions = [...previousQuestions];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newQuestions[index], newQuestions[targetIndex]] = [
      newQuestions[targetIndex],
      newQuestions[index],
    ];

    setQuiz({
      ...quiz,
      questions: newQuestions,
    });
    setValidationErrors((prev) =>
      reindexValidationErrorsForQuestions(prev, previousQuestions, newQuestions),
    );
  };

  const getQuestionErrors = (questionIndex: number): ValidationError[] => {
    const prefix = `questions[${questionIndex}]`;
    return validationErrors.filter((error) => error.field.startsWith(prefix));
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

  const builderBackHref = useMemo(() => {
    const id = savedQuizId ?? urlQuizId;
    if (id == null || String(id).trim() === "") {
      return "/dashboard/quizzes";
    }
    return `/dashboard/quiz/${String(id).trim()}`;
  }, [savedQuizId, urlQuizId]);

  const builderBackLabel = useMemo(() => {
    const id = savedQuizId ?? urlQuizId;
    if (id == null || String(id).trim() === "") {
      return t(locale, "builder.backToQuizzes");
    }
    return t(locale, "builder.backToQuizDetail");
  }, [savedQuizId, urlQuizId, locale]);

  const builderMobileBackLinkText = useMemo(() => {
    const id = savedQuizId ?? urlQuizId;
    if (id == null || String(id).trim() === "") {
      return t(locale, "builder.mobileBackLink");
    }
    return t(locale, "builder.mobileBackToQuizLink");
  }, [savedQuizId, urlQuizId, locale]);

  const handleQuizTitleChange = useCallback((next: string) => {
    setQuiz((prev) => ({ ...prev, name: next }));
    setValidationErrors((prev) => removeValidationErrorsForField(prev, "name"));
  }, []);

  const renderBuilderSaveActions = (layout: "desktop" | "mobile") => {
    const isMobileLayout = layout === "mobile";
    const saveIconClass = "h-3 w-3 sm:h-4 sm:w-4 shrink-0";
    const validationBadge =
      validationProblemAreaCount > 0 ? (
        <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground border-destructive">
          {validationProblemAreaCount}
        </Badge>
      ) : null;

    if (serverQuizStatus === "ARCHIVED") {
      return null;
    }

    const mobileActionButtonClass = isMobileLayout
      ? "w-full text-base relative gap-1.5"
      : "flex-1 sm:flex-initial text-base relative gap-1.5";

    if (serverQuizStatus === "DRAFT" && savedQuizId) {
      const draftBusy = isDraftServerManualSaveBusy({
        isSaving,
        isFinalizingDraft,
        builderSaveStatusKind,
        serverSaveUiPhase,
      });
      const draftSaveDisabled = isDraftServerManualSaveActionDisabled({
        isDirtyVersusBaseline,
        isSaving,
        isFinalizingDraft,
        builderSaveStatusKind,
        serverSaveUiPhase,
      });
      const showDraftSaveSpinner = draftBusy;

      const draftSaveControl = (
        <BuilderDraftSaveSplitButton
          locale={locale}
          quiz={quiz}
          setQuiz={setQuiz}
          onPrimarySaveClick={handleSave}
          primaryDisabled={draftSaveDisabled}
          isBusy={draftBusy}
          showPrimarySpinner={showDraftSaveSpinner}
          autosaveQueued={
            builderSaveStatusKind === "server_pending" && !draftBusy
          }
          savedClean={
            !isDirtyVersusBaseline &&
            builderSaveStatusKind !== "server_error"
          }
          validationBadge={validationBadge}
          isDestructiveStyled={builderSaveStatusKind === "server_error"}
          centerPrimaryContent={isMobileLayout}
          size={isMobileLayout ? "default" : "sm"}
        />
      );

      if (isMobileLayout) {
        return (
          <div className="flex w-full min-w-0 flex-col gap-2 border-b border-border/60 pb-5">
            {draftSaveControl}
            <Button
              type="button"
              variant="blue"
              onClick={() => setFinalizeDraftConfirmOpen(true)}
              disabled={
                !canFinalizeDraftQuiz ||
                !hasValidQuizTitle ||
                isSaving ||
                isFinalizingDraft ||
                serverSaveUiPhase === "autosaving"
              }
              className="w-full min-w-0 justify-center text-base gap-1.5"
              size="default"
              aria-label={t(locale, "builder.finalizeQuiz")}
            >
              {isFinalizingDraft
                ? t(locale, "builder.finalizingQuiz")
                : t(locale, "builder.finalizeQuizShort")}
            </Button>
          </div>
        );
      }

      return draftSaveControl;
    }

    if (
      isCreateQuizButtonDisabledForNoQuestionsAndClean({
        quizQuestionCount: quiz.questions.length,
        isDirtyVersusBaseline,
      })
    ) {
      return (
        <Button
          variant="blue"
          onClick={handleSave}
          disabled
          className={mobileActionButtonClass}
          size="default"
        >
          <Save className={saveIconClass} />
          {t(locale, "builder.createQuiz")}
          {validationBadge}
        </Button>
      );
    }

    if (builderSaveStatusKind === "server_error") {
      const errorLabel =
        serverQuizStatus === "ACTIVE"
          ? t(locale, "builder.saveChanges")
          : t(locale, "builder.save");
      return (
        <Button
          variant="outline"
          onClick={handleSave}
          className={cn(
            mobileActionButtonClass,
            "border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
          )}
          size="default"
        >
          <Save className={saveIconClass} />
          {errorLabel}
          {validationBadge}
        </Button>
      );
    }

    if (isSaving) {
      const savingLabel = (() => {
        if (!isQuizSaved) {
          return t(locale, "builder.createQuiz");
        }
        if (serverQuizStatus === "ACTIVE") {
          return t(locale, "builder.saveChanges");
        }
        return t(locale, "builder.saveQuiz");
      })();
      return (
        <Button
          variant="blue"
          disabled
          aria-busy={true}
          className={mobileActionButtonClass}
          size="default"
        >
          <Loader2 className={cn(saveIconClass, "animate-spin")} />
          {savingLabel}
          {validationBadge}
        </Button>
      );
    }

    if (serverQuizStatus === "ACTIVE") {
      return (
        <Button
          variant="blue"
          onClick={handleSave}
          disabled={isActivePrimarySaveDisabled({
            serverQuizStatus,
            isDirtyVersusBaseline,
            isSaving: false,
            isFinalizingDraft,
          })}
          className={mobileActionButtonClass}
          size="default"
        >
          <Save className={saveIconClass} />
          {t(locale, "builder.saveChanges")}
          {validationBadge}
        </Button>
      );
    }

    const primaryLabel = (() => {
      if (!isQuizSaved) {
        return t(locale, "builder.createQuiz");
      }
      return t(locale, "builder.saveQuiz");
    })();

    return (
      <Button
        variant="blue"
        onClick={handleSave}
        disabled={isFinalizingDraft}
        className={mobileActionButtonClass}
        size="default"
      >
        <Save className={saveIconClass} />
        {primaryLabel}
        {validationBadge}
      </Button>
    );
  };

  const builderHeaderSaveActions = renderBuilderSaveActions("desktop");
  const builderMobileSaveActions = renderBuilderSaveActions("mobile");

  const builderHeaderQuizMenu =
    isQuizSaved && savedQuizId ? (
      <QuizMenu
        quizId={savedQuizId}
        quizName={quiz.name}
        quizStatus={serverQuizStatus ?? "DRAFT"}
        elevateShareButton
        onDeleted={() => {
          requestNavigate("/dashboard");
        }}
      />
    ) : null;

  const isPreviewActionBusy = isPreparingPreview || isSaving || isFinalizingDraft;
  const previewQuizId = savedQuizId ?? urlQuizId ?? null;
  const canOpenPreviewViaLink =
    Boolean(previewQuizId) &&
    isQuizSaved &&
    !isDirtyVersusBaseline &&
    hasValidQuizTitle;

  const handleDirectPreviewLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      const mergedErrors = collectBuilderSaveValidationErrors(quiz, timeLimitUi);
      if (mergedErrors.length > 0) {
        event.preventDefault();
        handleValidationFailedSave(mergedErrors);
        showToast(t(locale, "builder.previewRequiresSaveError"), "error");
        return;
      }

      setBuilderHasUnsavedChanges(false);
    },
    [
      handleValidationFailedSave,
      locale,
      quiz,
      setBuilderHasUnsavedChanges,
      showToast,
      timeLimitUi,
    ],
  );

  const renderBuilderPreviewButton = (placement: "header" | "mobile") => {
    const isHeader = placement === "header";
    const previewIcon = isPreparingPreview ? (
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
    ) : (
      <Eye className="h-4 w-4 shrink-0" />
    );
    const previewLabel = isHeader ? (
      <span className="hidden lg:inline">{t(locale, "builder.previewQuiz")}</span>
    ) : (
      t(locale, "builder.previewQuiz")
    );

    if (canOpenPreviewViaLink && previewQuizId) {
      return (
        <Button
          asChild
          variant="outline"
          size={isHeader ? "default" : undefined}
          className={
            isHeader
              ? "hidden h-10 shrink-0 gap-1.5 text-base lg:inline-flex"
              : "h-10 w-full gap-2 text-base lg:hidden"
          }
          disabled={isPreviewActionBusy || isLoading || !hasValidQuizTitle}
          title={t(locale, "builder.previewQuiz")}
        >
          <Link
            href={buildQuizPreviewPath(previewQuizId)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleDirectPreviewLinkClick}
          >
            {previewIcon}
            {previewLabel}
          </Link>
        </Button>
      );
    }

    return (
      <Button
        type="button"
        variant="outline"
        size={isHeader ? "default" : undefined}
        className={
          isHeader
            ? "hidden h-10 shrink-0 gap-1.5 text-base lg:inline-flex"
            : "h-10 w-full gap-2 text-base lg:hidden"
        }
        onClick={() => void handlePreviewQuiz()}
        disabled={isPreviewActionBusy || isLoading || !hasValidQuizTitle}
        aria-busy={isPreparingPreview}
        title={t(locale, "builder.previewQuiz")}
      >
        {previewIcon}
        {previewLabel}
      </Button>
    );
  };

  const builderHeaderPreviewButton = renderBuilderPreviewButton("header");
  const builderMobilePreviewButton = renderBuilderPreviewButton("mobile");

  const builderDesktopFinalizeButton =
    serverQuizStatus === "DRAFT" && savedQuizId ? (
      <Button
        type="button"
        variant="blue"
        onClick={() => setFinalizeDraftConfirmOpen(true)}
        disabled={
          !canFinalizeDraftQuiz ||
          !hasValidQuizTitle ||
          isSaving ||
          isFinalizingDraft ||
          serverSaveUiPhase === "autosaving"
        }
        className="hidden min-w-0 shrink-0 text-base gap-1.5 lg:inline-flex"
        size="default"
      >
        <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
        {isFinalizingDraft
          ? t(locale, "builder.finalizingQuiz")
          : t(locale, "builder.finalizeQuiz")}
      </Button>
    ) : null;

  return (
    <>
      <AlertDialog
        open={previewReadyQuizId !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            dismissPreviewReadyDialog();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(locale, "builder.previewReadyTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(locale, "builder.previewReadyDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={dismissPreviewReadyDialog}
            >
              {t(locale, "builder.cancel")}
            </Button>
            {previewReadyQuizId ? (
              <Button asChild variant="blue" className="w-full sm:w-auto">
                <Link
                  href={buildQuizPreviewPath(previewReadyQuizId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={dismissPreviewReadyDialog}
                >
                  {t(locale, "builder.previewOpenLink")}
                </Link>
              </Button>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      <AlertDialog
        open={finalizeDraftConfirmOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !isFinalizingDraft) {
            setFinalizeDraftConfirmOpen(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(locale, "builder.finalizeConfirmModal.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t(locale, "builder.finalizeConfirmModal.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-4 sm:gap-1 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setFinalizeDraftConfirmOpen(false)}
              disabled={isFinalizingDraft}
            >
              {t(locale, "builder.finalizeConfirmModal.cancel")}
            </Button>
            <Button
              type="button"
              variant="blue"
              className="w-full sm:w-auto"
              disabled={isFinalizingDraft}
              onClick={() => {
                setFinalizeDraftConfirmOpen(false);
                void handleFinalizeDraft();
              }}
            >
              {t(locale, "builder.finalizeConfirmModal.confirm")}
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t(locale, "builder.activeSaveStatsModal.title")}</DialogTitle>
            <DialogDescription className="text-base">
              {t(locale, "builder.activeSaveStatsModal.description")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={handleActiveSaveStatsModalCancel}
            >
              {t(locale, "builder.activeSaveStatsModal.cancel")}
            </Button>
            <Button
              type="button"
              variant="blue"
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
      <div className="flex min-w-0 flex-col bg-white dark:bg-card lg:min-h-0 lg:h-full lg:flex-1 lg:overflow-hidden">
        <header className="hidden shrink-0 border-b border-border/50 bg-background/95 px-3 pb-2.5 pt-2.5 backdrop-blur-sm sm:px-4 sm:pb-3 sm:pt-3 md:px-6 lg:sticky lg:top-0 lg:z-20 lg:block">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row items-center justify-between gap-3 lg:gap-5">
              <div className="flex min-w-0 flex-1 items-center gap-2.5 lg:gap-3">
                <Button
                  asChild
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  aria-label={builderBackLabel}
                >
                  <Link
                    href={builderBackHref}
                    onClick={(event) => {
                      interceptLinkClick(event, builderBackHref);
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p
                    className={cn(
                      "truncate text-base font-semibold leading-tight tracking-tight",
                      isHeaderTitleUntitled
                        ? "italic text-muted-foreground/75"
                        : "text-foreground",
                    )}
                    title={builderHeaderDisplayTitle}
                  >
                    {builderHeaderDisplayTitle}
                  </p>
                </div>
              </div>
              <div className="flex min-w-0 shrink-0 flex-wrap items-center justify-end gap-2 lg:gap-2.5">
                {builderHeaderSaveActions}
                {builderHeaderPreviewButton}
                {builderDesktopFinalizeButton}
                {builderHeaderQuizMenu}
              </div>
            </div>
          </div>
          {shouldShowBuilderSaveStatusRow(builderSaveStatusKind) && !isLoading ? (
            <div className="mt-2 sm:mt-3">
              <BuilderSaveStatus
                locale={locale}
                kind={builderSaveStatusKind}
                isLoading={isLoading}
              />
            </div>
          ) : null}
          {saveErrorReportBanner}
        </header>

        <div className="flex min-h-0 flex-col lg:h-full lg:flex-1 lg:flex-row lg:items-stretch lg:overflow-hidden">
          <div className="relative z-10 hidden min-h-0 w-full shrink-0 border-r border-border/60 bg-muted/25 lg:flex lg:h-full lg:w-64 lg:flex-col lg:self-stretch lg:overflow-hidden 2xl:w-72">
            <BuilderDesktopSidebar
              locale={locale}
              isSettingsSelected={desktopBuilderSelection.view === "settings"}
              settingsHasError={builderSettingsPanelHasError}
              onSettingsClick={handleDesktopSettingsClick}
              questions={quiz.questions}
              activeQuestionId={
                desktopBuilderSelection.view === "questions" ? activeQuestionId : null
              }
              onQuestionClick={handleNavigatorQuestionClick}
              onAddQuestion={() => {
                handleAddQuestion();
              }}
              onReorder={(nextQuestions) => {
                const previousQuestions = quiz.questions;
                setQuiz((prev) => ({
                  ...prev,
                  questions: nextQuestions,
                }));
                setValidationErrors((prev) =>
                  reindexValidationErrorsForQuestions(
                    prev,
                    previousQuestions,
                    nextQuestions,
                  ),
                );
              }}
              questionErrorIds={questionErrorIds}
            />
          </div>

          <section className="relative flex flex-col bg-muted/10 min-w-0 lg:min-h-0 lg:flex-1 lg:overflow-hidden">
            <div className="space-y-3 px-3 pb-2 pt-2 lg:hidden sm:px-4 md:px-6">
              <BuilderMobileQuizCard
                locale={locale}
                quizName={quiz.name}
                onQuizNameChange={handleQuizTitleChange}
                getNameError={getNameError}
                editorialStatus={displayedEditorialStatus}
                backHref={builderBackHref}
                backLinkText={builderMobileBackLinkText}
                onBackLinkClick={(event) => {
                  interceptLinkClick(event, builderBackHref);
                }}
                onOpenSettings={() => setQuizSettingsSheetOpen(true)}
                trailingActions={builderHeaderQuizMenu}
              />
              <div className="flex w-full flex-col gap-2">
                {builderMobileSaveActions !== null ? builderMobileSaveActions : null}
                {builderMobilePreviewButton}
              </div>
              {shouldShowBuilderSaveStatusRow(builderSaveStatusKind) && !isLoading ? (
                <BuilderSaveStatus
                  locale={locale}
                  kind={builderSaveStatusKind}
                  isLoading={isLoading}
                />
              ) : null}
              {saveErrorReportBanner}
            </div>
            {isLargeViewport ? (
              <div
                ref={builderMainScrollRef}
                className="hidden min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-3 pb-10 pt-3 sm:px-4 sm:pb-12 sm:pt-4 md:px-6 md:pb-16 md:pt-6 lg:builder-scrollbar lg:flex lg:scroll-pt-4 lg:pt-6"
              >
                {desktopBuilderSelection.view === "settings" ? (
                  <BuilderQuizSettingsPanel
                    locale={locale}
                    quiz={quiz}
                    setQuiz={setQuiz}
                    timeLimitUi={timeLimitUi}
                    setTimeLimitUi={setTimeLimitUi}
                    getTimeLimitError={getTimeLimitError}
                    getNameError={getNameError}
                    setValidationErrors={setValidationErrors}
                    nameFieldValue={quizNameForEditing}
                    autoFocusNameField={shouldAutoFocusQuizNameField}
                  />
                ) : quiz.questions.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center py-8 text-center sm:py-12">
                      <Image
                        src="/todo-illustration.svg"
                        alt=""
                        width={320}
                        height={240}
                        className="mb-6 h-auto w-full max-w-[220px] sm:max-w-[260px]"
                        priority
                      />
                      <h2 className="mb-2 text-xl font-semibold text-foreground">
                        {t(locale, "builder.emptyQuestionsTitleDesktop")}
                      </h2>
                      <p className="mb-6 max-w-md text-base text-muted-foreground">
                        {t(locale, "builder.emptyQuestionsDescriptionDesktop")}
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => handleAddQuestion()}
                        size="default"
                        className="text-base"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        {t(locale, "builder.addQuestion")}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="w-full min-w-0 space-y-3">
                    {quiz.questions.map((question, index) => (
                      <div key={question.id}>
                        {index > 0 && (
                          <div className="relative z-20 -my-2 mb-2 flex h-4 items-center justify-center group/insert">
                            <div className="pointer-events-none flex items-center justify-center gap-2 opacity-100 md:opacity-0 transition-opacity group-hover/insert:opacity-100">
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
                            isNavActive={activeQuestionId === question.id}
                            onAnimationEnd={() => setNewlyAddedQuestionId(null)}
                            onRemoveAnimationEnd={() => commitDeleteQuestion(question.id)}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="blue"
                        onClick={() => handleAddQuestion()}
                        size="default"
                        className="mb-10 text-base"
                      >
                        <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                        {t(locale, "builder.addQuestion")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : quiz.questions.length === 0 ? (
              <div
                ref={builderMainScrollRef}
                className="px-3 pb-10 pt-3 sm:px-4 sm:pb-12 sm:pt-4 md:px-6 md:pb-16 md:pt-6"
              >
                <Card>
                  <CardContent className="flex flex-col items-center py-8 text-center sm:py-12">
                    <Image
                      src="/todo-illustration.svg"
                      alt=""
                      width={320}
                      height={240}
                      className="mb-6 h-auto w-full max-w-[220px] sm:max-w-[260px]"
                      priority
                    />
                    <h2 className="mb-2 text-xl font-semibold text-foreground">
                      {t(locale, "builder.emptyQuestionsTitle")}
                    </h2>
                    <p className="mb-6 max-w-md text-base text-muted-foreground">
                      {t(locale, "builder.emptyQuestionsDescription")}
                    </p>
                    <Button
                      variant="primary"
                      onClick={() => handleAddQuestion()}
                      size="default"
                      className="text-base"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      {t(locale, "builder.addQuestion")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Tabs
                value={builderTabsValue}
                onValueChange={(value) => {
                  const nextMode = value as BuilderViewMode;
                  if (nextMode === "organize") {
                    setOrganizePanelAnimationKey((key) => key + 1);
                  }
                  setBuilderViewMode(nextMode);
                }}
                className="flex min-h-0 w-full min-w-0 flex-1 flex-col lg:overflow-hidden"
              >
                <BuilderMobileStickyTabsBar
                  className={cn(
                    "mb-4 w-full bg-muted/10 px-3 py-1 backdrop-blur-sm lg:hidden",
                    "supports-[backdrop-filter]:bg-muted/80",
                    "border-b border-border/40",
                    "sm:px-4 md:px-6",
                  )}
                >
                  <TabsList className="mb-0 grid h-auto w-full grid-cols-2">
                    <TabsTrigger value="edit" className="text-base">
                      {t(locale, "builder.viewModeEdit")}
                    </TabsTrigger>
                    <TabsTrigger value="organize" className="text-base">
                      {t(locale, "builder.viewModeOrganize")}
                    </TabsTrigger>
                  </TabsList>
                </BuilderMobileStickyTabsBar>
                <div
                  ref={builderMainScrollRef}
                  className="px-3 pb-10 sm:px-4 sm:pb-12 md:px-6 md:pb-16 lg:builder-scrollbar lg:min-h-0 lg:flex-1 lg:overflow-x-hidden lg:overflow-y-auto lg:scroll-pt-4 lg:pt-6"
                >
                  <TabsContent value="edit" className="mt-0 w-full min-w-0 outline-none">
                    <div className="w-full min-w-0 space-y-3">
                      {quiz.questions.map((question, index) => (
                        <div key={question.id}>
                          {index > 0 && (
                            <div className="relative z-20 -my-2 mb-2 flex h-4 items-center justify-center group/insert">
                              <div className="pointer-events-none flex items-center justify-center gap-2 opacity-100 md:opacity-0 transition-opacity group-hover/insert:opacity-100">
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
                    </div>
                  </TabsContent>
                  <TabsContent value="organize" className="mt-0 outline-none lg:hidden">
                    <BuilderMobileOrganizeTabPanel
                      animationKey={organizePanelAnimationKey}
                      prefersReducedMotion={prefersReducedMotion}
                    >
                      <BuilderOrganizeQuestionsList
                        locale={locale}
                        questions={quiz.questions}
                        onReorder={(nextQuestions) => {
                          const previousQuestions = quiz.questions;
                          setQuiz({
                            ...quiz,
                            questions: nextQuestions,
                          });
                          setValidationErrors((prev) =>
                            reindexValidationErrorsForQuestions(
                              prev,
                              previousQuestions,
                              nextQuestions,
                            ),
                          );
                        }}
                        onMoveUp={(index) => handleMoveQuestion(index, "up")}
                        onMoveDown={(index) => handleMoveQuestion(index, "down")}
                        onDeleteQuestion={commitDeleteQuestion}
                        onEditQuestion={handleEditQuestionFromOrganize}
                        questionErrorIds={questionErrorIds}
                      />
                    </BuilderMobileOrganizeTabPanel>
                  </TabsContent>
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="blue"
                      onClick={() => handleAddQuestion()}
                      size="default"
                      className="text-base mb-10"
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                      {t(locale, "builder.addQuestion")}
                    </Button>
                  </div>
                </div>
              </Tabs>
            )}
            {quiz.questions.length > 0 &&
            (!isLargeViewport || desktopBuilderSelection.view === "questions") ? (
              <BuilderBackToTopButton
                scrollContainerRef={builderMainScrollRef}
                layoutKey={`${quiz.questions.length}-${builderViewMode}`}
                label={t(locale, "builder.backToTop")}
              />
            ) : null}
          </section>
        </div>
      </div>
      <BuilderQuizSettingsSheet
        open={quizSettingsSheetOpen}
        onOpenChange={setQuizSettingsSheetOpen}
        locale={locale}
        quiz={quiz}
        setQuiz={setQuiz}
        timeLimitUi={timeLimitUi}
        setTimeLimitUi={setTimeLimitUi}
        getTimeLimitError={getTimeLimitError}
        getNameError={getNameError}
        setValidationErrors={setValidationErrors}
        showNameField={false}
      />
      <FullscreenBlockingOverlay
        open={isSaving || isFinalizingDraft || isPreparingPreview}
        title={
          isPreparingPreview
            ? t(locale, "builder.preparingPreview")
            : isFinalizingDraft
              ? t(locale, "builder.blockingFinalizeTitle")
              : t(locale, "builder.blockingSaveTitle")
        }
        description={
          isPreparingPreview
            ? t(locale, "builder.blockingSaveDescription")
            : isFinalizingDraft
              ? t(locale, "builder.blockingFinalizeDescription")
              : t(locale, "builder.blockingSaveDescription")
        }
      />
    </>
  );
}

