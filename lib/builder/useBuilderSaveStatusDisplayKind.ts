"use client";

import { useEffect, useMemo, useState } from "react";
import {
  resolveBuilderSaveStatusDisplay,
  type BuilderSaveStatusDisplayInput,
} from "@/lib/builder/builderSaveStatusDisplay";

export function useBuilderSaveStatusDisplayKind(
  input: Omit<BuilderSaveStatusDisplayInput, "nowMs">,
): ReturnType<typeof resolveBuilderSaveStatusDisplay> {
  const [clockMs, setClockMs] = useState(() => Date.now());

  useEffect(() => {
    setClockMs(Date.now());
  }, [
    input.phase,
    input.isDirtyVersusBaseline,
    input.savedQuizId,
    input.lastServerAutosaveSuccessAt,
    input.quizLifecycleStatus,
  ]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setClockMs(Date.now());
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  return useMemo(
    () =>
      resolveBuilderSaveStatusDisplay({
        ...input,
        nowMs: clockMs,
      }),
    [
      input.phase,
      input.savedQuizId,
      input.quizLifecycleStatus,
      input.isDirtyVersusBaseline,
      input.quizQuestionCount,
      input.gateProceedsForServerAutosave,
      input.isManualSaving,
      input.lastServerAutosaveSuccessAt,
      clockMs,
    ],
  );
}
