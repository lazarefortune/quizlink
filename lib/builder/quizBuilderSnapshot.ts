import {
  resolvePersistedTimeLimit,
  type BuilderTimeLimitUi,
} from "@/lib/time-limit-seconds";
import type { QuizBuilder } from "@/types/quiz-builder";

export function computeQuizBuilderSnapshot(
  q: QuizBuilder,
  timeLimitUi: BuilderTimeLimitUi,
): string {
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
      imageKey: question.imageKey ?? "",
      options: question.options.map((o) => ({
        id: o.id,
        label: o.label,
        isCorrect: o.isCorrect,
      })),
    })),
  });
}
