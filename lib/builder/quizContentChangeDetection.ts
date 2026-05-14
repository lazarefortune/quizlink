import type { Question, QuizBuilder } from "@/types/quiz-builder";

function normalizeOptionComparable(option: { label: string; isCorrect: boolean }): {
  label: string;
  isCorrect: boolean;
} {
  return {
    label: option.label.trim(),
    isCorrect: option.isCorrect,
  };
}

function optionsMultisetSignature(
  options: ReadonlyArray<{ label: string; isCorrect: boolean }>,
): string {
  const normalized = options.map(normalizeOptionComparable);
  normalized.sort((a, b) => {
    const byLabel = a.label.localeCompare(b.label, "en");
    if (byLabel !== 0) {
      return byLabel;
    }
    return Number(a.isCorrect) - Number(b.isCorrect);
  });
  return normalized.map((o) => `${o.label}\u001f${o.isCorrect}`).join("\u001e");
}

function questionPlayableSignature(question: Pick<Question, "type" | "label" | "options"> & {
  image?: string;
  imageKey?: string;
  explanation?: string;
}): string {
  const explanation = (question.explanation ?? "").trim();
  const image = question.image ?? "";
  const imageKey = question.imageKey ?? "";
  const optionsSig = optionsMultisetSignature(question.options);
  return [
    question.type,
    question.label.trim(),
    image,
    imageKey,
    explanation,
    optionsSig,
  ].join("\u001f");
}

/**
 * Stable fingerprint of playable quiz content: questions multiset (order-independent),
 * options multiset per question (order-independent). Ignores quiz name, visibility, settings,
 * question/option ids, and question order.
 */
export function buildPlayableContentMultisetKey(quiz: Pick<QuizBuilder, "questions">): string {
  const signatures = quiz.questions.map((q) => questionPlayableSignature(q));
  signatures.sort();
  return signatures.join("\u001d");
}

export function hasQuizPlayableContentChanged(
  previousQuiz: Pick<QuizBuilder, "questions">,
  nextQuiz: Pick<QuizBuilder, "questions">,
): boolean {
  return buildPlayableContentMultisetKey(previousQuiz) !== buildPlayableContentMultisetKey(nextQuiz);
}
