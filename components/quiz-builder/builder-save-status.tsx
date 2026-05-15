"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  Check,
  Clock,
  Cloud,
  Loader2,
  Save,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";
import {
  type BuilderSaveStatusDisplayKind,
  type BuilderServerSaveUiPhase,
  resolveBuilderSaveStatusDisplay,
} from "@/lib/builder/builderSaveStatusDisplay";

type BuilderSaveStatusProps = {
  locale: Locale;
  phase: BuilderServerSaveUiPhase;
  savedQuizId: string | null;
  quizLifecycleStatus: QuizLifecycleStatus | null;
  isDirtyVersusBaseline: boolean;
  quizQuestionCount: number;
  gateProceedsForServerAutosave: boolean;
  isManualSaving: boolean;
  lastServerAutosaveSuccessAt: number | null;
  isLoading: boolean;
};

function messageKeyForKind(kind: BuilderSaveStatusDisplayKind): string | null {
  switch (kind) {
    case "local_draft":
      return "builder.saveStatus.localCopy";
    case "server_pending":
      return "builder.saveStatus.pending";
    case "server_saving":
      return "builder.saveStatus.saving";
    case "server_saved_flash":
    case "server_saved_recent":
    case "server_idle":
      return "builder.saveStatus.draftSaved";
    case "server_idle_manual":
      return "builder.saveStatus.upToDate";
    case "manual_save_active":
      return "builder.saveStatus.unsaved";
    case "archived_readonly":
      return "builder.saveStatus.archived";
    case "server_error":
      return "builder.saveStatus.saveError";
    default:
      return null;
  }
}

function StatusIcon({
  kind,
  className,
}: {
  kind: Exclude<BuilderSaveStatusDisplayKind, "hidden">;
  className?: string;
}) {
  const iconClass = cn("h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4", className);
  switch (kind) {
    case "local_draft":
      return <Smartphone className={iconClass} aria-hidden />;
    case "server_idle":
      return <Cloud className={iconClass} aria-hidden />;
    case "server_idle_manual":
      return <Check className={cn(iconClass, "text-emerald-600 dark:text-emerald-500")} aria-hidden />;
    case "manual_save_active":
      return <Save className={cn(iconClass, "text-muted-foreground")} aria-hidden />;
    case "archived_readonly":
      return <Archive className={cn(iconClass, "text-muted-foreground")} aria-hidden />;
    case "server_pending":
      return <Clock className={iconClass} aria-hidden />;
    case "server_saving":
      return (
        <Loader2
          className={cn(iconClass, "animate-spin text-muted-foreground")}
          aria-hidden
        />
      );
    case "server_saved_flash":
    case "server_saved_recent":
      return <Check className={cn(iconClass, "text-emerald-600 dark:text-emerald-500")} aria-hidden />;
    case "server_error":
      return <AlertCircle className={cn(iconClass, "text-destructive")} aria-hidden />;
  }
}

export function BuilderSaveStatus({
  locale,
  phase,
  savedQuizId,
  quizLifecycleStatus,
  isDirtyVersusBaseline,
  quizQuestionCount,
  gateProceedsForServerAutosave,
  isManualSaving,
  lastServerAutosaveSuccessAt,
  isLoading,
}: BuilderSaveStatusProps) {
  const [clockMs, setClockMs] = useState(() => Date.now());

  useEffect(() => {
    setClockMs(Date.now());
  }, [phase, isDirtyVersusBaseline, savedQuizId, lastServerAutosaveSuccessAt, quizLifecycleStatus]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setClockMs(Date.now());
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  const kind = useMemo(
    () =>
      resolveBuilderSaveStatusDisplay({
        phase,
        savedQuizId,
        quizLifecycleStatus,
        isDirtyVersusBaseline,
        quizQuestionCount,
        gateProceedsForServerAutosave,
        isManualSaving,
        lastServerAutosaveSuccessAt,
        nowMs: clockMs,
      }),
    [
      phase,
      savedQuizId,
      quizLifecycleStatus,
      isDirtyVersusBaseline,
      quizQuestionCount,
      gateProceedsForServerAutosave,
      isManualSaving,
      lastServerAutosaveSuccessAt,
      clockMs,
    ],
  );

  if (isLoading) {
    return null;
  }

  const primaryKey = messageKeyForKind(kind);
  if (primaryKey === null || kind === "hidden") {
    return null;
  }

  const hideOnMobile =
    kind === "server_idle" ||
    kind === "server_saved_flash" ||
    kind === "server_saved_recent" ||
    kind === "server_idle_manual";

  const isDraftSavedLine =
    primaryKey === "builder.saveStatus.draftSaved";

  return (
    <div
      className={cn(
        "w-full rounded-md border border-border/50 bg-muted/20 px-2.5 py-2 sm:max-w-md sm:border-0 sm:bg-transparent sm:px-0 sm:py-0",
        hideOnMobile && "hidden sm:block",
      )}
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex items-center gap-2",
          isDraftSavedLine
            ? "justify-center sm:justify-end"
            : "justify-end",
        )}
      >
        <StatusIcon kind={kind} />
        {isDraftSavedLine ? (
          <p className="text-xs font-medium leading-snug text-foreground/90 sm:text-sm">
            <span className="sm:hidden">
              {t(locale, "builder.saveStatus.draftSavedShort")}
            </span>
            <span className="hidden sm:inline">
              {t(locale, "builder.saveStatus.draftSaved")}
            </span>
          </p>
        ) : (
          <p className="text-xs font-medium leading-snug text-foreground/90 sm:text-sm">
            {t(locale, primaryKey)}
          </p>
        )}
      </div>
    </div>
  );
}
