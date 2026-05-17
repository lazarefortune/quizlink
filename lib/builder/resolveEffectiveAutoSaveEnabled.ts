import type { QuizSettings } from "@/types/quiz-builder";

/** Server autosave proceeds only when this returns true for DRAFT quizzes. Missing / undefined → treated as enabled. */
export function resolveEffectiveAutoSaveEnabled(settings: Pick<QuizSettings, "autoSaveEnabled">): boolean {
  return settings.autoSaveEnabled !== false;
}
