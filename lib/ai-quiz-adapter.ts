import type { Question } from "@/types/quiz-builder";
import type { QuizBuilder, QuizVisibility, QuizSettings } from "@/types/quiz-builder";

export function createQuizBuilderFromAiQuestions(
  questions: Question[],
  options: {
    name: string;
    visibility: QuizVisibility;
    settings: QuizSettings;
  }
): QuizBuilder {
  return {
    id: `quiz-ai-${Date.now()}`,
    name: options.name,
    visibility: options.visibility,
    settings: options.settings,
    questions,
    createdBy: "ANONYMOUS",
    createdAt: new Date().toISOString(),
  };
}
