import type { ValidationError } from "@/lib/quiz-validation";
import type { Question } from "@/types/quiz-builder";

/**
 * Logical destination of the first error the user should be guided to.
 * Kept in a single discriminated union so the caller decides how to map
 * each kind to a DOM element / sheet to open.
 */
export type BuilderValidationErrorTarget =
  | { type: "quiz-name" }
  | { type: "quiz-settings" }
  | { type: "question"; questionId: string; questionIndex: number };

const QUESTION_FIELD_PATTERN = /^questions\[(\d+)\]/;

function parseQuestionIndex(field: string): number | null {
  const match = QUESTION_FIELD_PATTERN.exec(field);
  if (!match || match[1] === undefined) {
    return null;
  }
  const idx = parseInt(match[1], 10);
  if (!Number.isFinite(idx) || idx < 0) {
    return null;
  }
  return idx;
}

/**
 * Returns the first validation error to guide the user toward, in this priority:
 *   1. quiz name
 *   2. quiz settings (e.g. time limit)
 *   3. first question (by index) that has any error
 *
 * Returns null when the array is empty or no error matches a known target.
 */
export function findFirstBuilderValidationErrorTarget(
  errors: ValidationError[],
  questions: Question[],
): BuilderValidationErrorTarget | null {
  if (errors.length === 0) {
    return null;
  }

  if (errors.some((error) => error.field === "name")) {
    return { type: "quiz-name" };
  }

  if (errors.some((error) => error.field.startsWith("settings."))) {
    return { type: "quiz-settings" };
  }

  let firstIndex = Number.POSITIVE_INFINITY;
  for (const error of errors) {
    const idx = parseQuestionIndex(error.field);
    if (idx !== null && idx < firstIndex) {
      firstIndex = idx;
    }
  }

  if (!Number.isFinite(firstIndex)) {
    return null;
  }

  const question = questions[firstIndex];
  if (!question) {
    return null;
  }

  return {
    type: "question",
    questionId: question.id,
    questionIndex: firstIndex,
  };
}

/**
 * Returns the set of question ids that have at least one validation error,
 * used by the desktop sidebar to flag affected questions.
 */
export function buildBuilderQuestionErrorIdSet(
  errors: ValidationError[],
  questions: Question[],
): Set<string> {
  const ids = new Set<string>();
  for (const error of errors) {
    const idx = parseQuestionIndex(error.field);
    if (idx === null) {
      continue;
    }
    const question = questions[idx];
    if (question) {
      ids.add(question.id);
    }
  }
  return ids;
}

/**
 * Counts distinct "problem zones" the user has to fix, so the save-button badge
 * never inflates because a single question has several errors:
 *   - the quiz name field (0 or 1)
 *   - the settings panel (0 or 1)
 *   - one count per question with at least one error
 *
 * The settings panel collapses into one zone since all its inputs live in the
 * same sheet, so two settings errors still count as one place to look at.
 */
export function countBuilderValidationProblemAreas(
  errors: ValidationError[],
  questions: Question[],
): number {
  if (errors.length === 0) {
    return 0;
  }
  let count = 0;
  if (errors.some((error) => error.field === "name")) {
    count += 1;
  }
  if (errors.some((error) => error.field.startsWith("settings."))) {
    count += 1;
  }
  count += buildBuilderQuestionErrorIdSet(errors, questions).size;
  return count;
}
