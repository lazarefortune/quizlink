export type QuizDetailTab = "questions" | "results";

const VALID_TABS: ReadonlySet<QuizDetailTab> = new Set(["questions", "results"]);

export function parseQuizDetailTab(value: string | null | undefined): QuizDetailTab {
  if (value != null && VALID_TABS.has(value as QuizDetailTab)) {
    return value as QuizDetailTab;
  }
  return "questions";
}

export function isQuizDetailTab(value: string | null | undefined): value is QuizDetailTab {
  return value != null && VALID_TABS.has(value as QuizDetailTab);
}
