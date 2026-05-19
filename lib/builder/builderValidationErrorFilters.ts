import type { ValidationError } from "@/lib/quiz-validation";
import type { Question } from "@/types/quiz-builder";

const QUESTION_PREFIX_PATTERN = /^questions\[(\d+)\]/;

/**
 * Drop only the errors whose field equals `field`. Other errors stay untouched.
 */
export function removeValidationErrorsForField(
  errors: ValidationError[],
  field: string,
): ValidationError[] {
  return errors.filter((error) => error.field !== field);
}

/**
 * Drop only the errors whose field starts with `prefix`. Other errors stay untouched.
 * Useful when a field has nested errors (e.g. settings.*).
 */
export function removeValidationErrorsForFieldPrefix(
  errors: ValidationError[],
  prefix: string,
): ValidationError[] {
  return errors.filter((error) => !error.field.startsWith(prefix));
}

/**
 * Drop only the errors belonging to a question identified by its index in the array
 * (i.e. fields starting with `questions[N]`). Other questions' errors are kept.
 */
export function removeValidationErrorsForQuestionIndex(
  errors: ValidationError[],
  questionIndex: number,
): ValidationError[] {
  const prefix = `questions[${questionIndex}]`;
  return errors.filter((error) => !error.field.startsWith(prefix));
}

/**
 * Drop errors belonging to the question identified by its id. The id is resolved
 * against the provided questions array. If the question is unknown, returns the
 * input unchanged so the caller never accidentally clears unrelated errors.
 */
export function removeValidationErrorsForQuestionId(
  errors: ValidationError[],
  questions: Question[],
  questionId: string,
): ValidationError[] {
  const idx = questions.findIndex((q) => q.id === questionId);
  if (idx < 0) {
    return errors;
  }
  return removeValidationErrorsForQuestionIndex(errors, idx);
}

/**
 * Drop only the errors that belong to one specific option of a question.
 */
export function removeValidationErrorsForOption(
  errors: ValidationError[],
  questionIndex: number,
  optionIndex: number,
): ValidationError[] {
  const prefix = `questions[${questionIndex}].options[${optionIndex}]`;
  return errors.filter((error) => !error.field.startsWith(prefix));
}

/**
 * Compare a question before/after an edit and remove only the errors that
 * no longer make sense after the user's specific change.
 *
 * The diff is intentionally conservative: it never removes errors that belong
 * to other questions, and it does not assume an edit fixes the field — it only
 * drops the inline error so the user gets immediate visual feedback while typing.
 */
export function removeValidationErrorsAfterQuestionChange(
  errors: ValidationError[],
  questionIndex: number,
  previous: Question,
  next: Question,
): ValidationError[] {
  const prefix = `questions[${questionIndex}]`;

  // Type switch reshapes options/correctAnswer constraints: drop everything
  // for this question to avoid showing stale errors that no longer apply.
  if (previous.type !== next.type) {
    return removeValidationErrorsForQuestionIndex(errors, questionIndex);
  }

  let result = errors;

  if (previous.label !== next.label) {
    result = removeValidationErrorsForField(result, `${prefix}.label`);
  }

  const prevOpts = previous.options;
  const nextOpts = next.options;

  if (prevOpts.length !== nextOpts.length) {
    result = result.filter(
      (error) =>
        error.field !== `${prefix}.options` &&
        error.field !== `${prefix}.correctAnswer` &&
        !error.field.startsWith(`${prefix}.options[`),
    );
    return result;
  }

  let correctnessChanged = false;
  for (let i = 0; i < nextOpts.length; i += 1) {
    const prevOpt = prevOpts[i];
    const nextOpt = nextOpts[i];
    if (!prevOpt || !nextOpt) {
      continue;
    }
    if (prevOpt.label !== nextOpt.label) {
      result = removeValidationErrorsForField(
        result,
        `${prefix}.options[${i}].label`,
      );
    }
    if (prevOpt.isCorrect !== nextOpt.isCorrect) {
      correctnessChanged = true;
    }
  }
  if (correctnessChanged) {
    result = removeValidationErrorsForField(result, `${prefix}.correctAnswer`);
  }
  return result;
}

/**
 * After a structural change to the questions array (delete, move, reorder),
 * realign question-scoped errors with the new indexes. Errors that referred
 * to a question that is no longer present are dropped; all other errors are
 * preserved and re-indexed.
 *
 * Non-question errors (name, settings.*) are returned unchanged.
 */
export function reindexValidationErrorsForQuestions(
  errors: ValidationError[],
  previousQuestions: Question[],
  nextQuestions: Question[],
): ValidationError[] {
  const nextIndexById = new Map<string, number>();
  nextQuestions.forEach((q, idx) => {
    nextIndexById.set(q.id, idx);
  });

  const result: ValidationError[] = [];
  for (const error of errors) {
    const match = QUESTION_PREFIX_PATTERN.exec(error.field);
    if (!match || match[1] === undefined) {
      result.push(error);
      continue;
    }
    const oldIdx = parseInt(match[1], 10);
    if (!Number.isFinite(oldIdx) || oldIdx < 0) {
      continue;
    }
    const previousQuestion = previousQuestions[oldIdx];
    if (!previousQuestion) {
      continue;
    }
    const newIdx = nextIndexById.get(previousQuestion.id);
    if (newIdx === undefined) {
      continue;
    }
    if (newIdx === oldIdx) {
      result.push(error);
      continue;
    }
    result.push({
      ...error,
      field: error.field.replace(
        `questions[${oldIdx}]`,
        `questions[${newIdx}]`,
      ),
    });
  }
  return result;
}
