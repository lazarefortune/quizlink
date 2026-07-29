import { isValidQuizName, normalizeQuizName } from "@/lib/quiz/quizNameValidation";
import { richTextToPlainText } from "@/lib/rich-text/richTextToPlainText";
import {
  totalSecondsFromMinutesSeconds,
  TIME_LIMIT_MINUTES_MAX,
  TIME_LIMIT_SECONDS_MAX,
  type BuilderTimeLimitUi,
} from "@/lib/time-limit-seconds";
import type { QuizBuilder } from "@/types/quiz-builder";

export type ValidationError = {
  field: string;
  translationKey: string;
  params?: Record<string, string | number>;
};

/** Aligns with a reasonable title length for storage and UI; enforced in builder validation and inputs. */
export const QUIZ_NAME_MAX_LENGTH = 200;

/** Errors shown in the quiz options panel (name + settings / time limit). */
export function hasQuizOptionsPanelErrors(errors: ValidationError[]): boolean {
  return errors.some(
    (error) => error.field === "name" || error.field.startsWith("settings."),
  );
}

export function validateQuizNameField(name: string): ValidationError | null {
  const normalizedName = normalizeQuizName(name);
  if (!isValidQuizName(normalizedName)) {
    return {
      field: "name",
      translationKey: "builder.validation.quizNameRequired",
    };
  }
  if (normalizedName.length > QUIZ_NAME_MAX_LENGTH) {
    return {
      field: "name",
      translationKey: "builder.validation.quizNameMaxLength",
      params: { max: QUIZ_NAME_MAX_LENGTH },
    };
  }
  return null;
}

export function validateQuizMetadata(
  quiz: Pick<QuizBuilder, "name">,
  timeLimitUi: BuilderTimeLimitUi,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const nameError = validateQuizNameField(quiz.name);
  if (nameError) {
    errors.push(nameError);
  }
  const timeLimitError = validateBuilderTimeLimit(timeLimitUi);
  if (timeLimitError) {
    errors.push(timeLimitError);
  }
  return errors;
}

export function validateQuizQuestions(quiz: Pick<QuizBuilder, "questions">): ValidationError[] {
  const errors: ValidationError[] = [];

  quiz.questions.forEach((question, index) => {
    const questionPrefix = `questions[${index}]`;
    const questionNumber = index + 1;

    if (richTextToPlainText(question.label).length === 0) {
      errors.push({
        field: `${questionPrefix}.label`,
        translationKey: "builder.validation.questionLabelRequired",
        params: { number: questionNumber },
      });
    }

    if (question.type === "TRUE_FALSE") {
      if (question.options.length !== 2) {
        errors.push({
          field: `${questionPrefix}.options`,
          translationKey: "builder.validation.exactlyTwoOptions",
          params: { number: questionNumber },
        });
      }
    }

    if (question.options.length < 2) {
      errors.push({
        field: `${questionPrefix}.options`,
        translationKey: "builder.validation.atLeastTwoOptions",
        params: { number: questionNumber },
      });
    }

    const correctAnswers = question.options.filter((opt) => opt.isCorrect).length;

    if (correctAnswers === 0) {
      errors.push({
        field: `${questionPrefix}.correctAnswer`,
        translationKey: "builder.validation.atLeastOneCorrectAnswer",
        params: { number: questionNumber },
      });
    } else if (question.type === "MULTIPLE_CHOICE" && correctAnswers > 1) {
      errors.push({
        field: `${questionPrefix}.correctAnswer`,
        translationKey: "builder.validation.exactlyOneCorrectAnswer",
        params: { number: questionNumber },
      });
    }

    question.options.forEach((option, optIndex) => {
      if (!option.label.trim()) {
        errors.push({
          field: `${questionPrefix}.options[${optIndex}].label`,
          translationKey: "builder.validation.optionLabelRequired",
          params: { questionNumber, optionNumber: optIndex + 1 },
        });
      }
    });
  });

  return errors;
}

export function validateQuiz(quiz: QuizBuilder): ValidationError[] {
  return [
    ...validateQuizMetadata(quiz, deriveTimeLimitUiFromSettingsForValidation(quiz)),
    ...validateQuizQuestions(quiz),
  ];
}

export function validateQuizWithTimeLimitUi(
  quiz: QuizBuilder,
  timeLimitUi: BuilderTimeLimitUi,
): ValidationError[] {
  return [...validateQuizMetadata(quiz, timeLimitUi), ...validateQuizQuestions(quiz)];
}

function deriveTimeLimitUiFromSettingsForValidation(
  quiz: Pick<QuizBuilder, "settings">,
): BuilderTimeLimitUi {
  const seconds = quiz.settings.timeLimitPerQuestion;
  if (seconds == null || seconds <= 0) {
    return { enabled: false, minutes: 0, seconds: 0 };
  }
  const minutes = Math.floor(seconds / 60);
  return {
    enabled: true,
    minutes,
    seconds: seconds % 60,
  };
}

export function validateBuilderTimeLimit(ui: BuilderTimeLimitUi): ValidationError | null {
  if (!ui.enabled) {
    return null;
  }
  if (!Number.isInteger(ui.minutes) || !Number.isInteger(ui.seconds)) {
    return {
      field: "settings.timeLimitPerQuestion",
      translationKey: "builder.validation.timeLimitInvalid",
    };
  }
  if (ui.seconds < 0 || ui.seconds > 59) {
    return {
      field: "settings.timeLimitPerQuestion",
      translationKey: "builder.validation.timeLimitSecondsOutOfRange",
    };
  }
  if (ui.minutes < 0 || ui.minutes > TIME_LIMIT_MINUTES_MAX) {
    return {
      field: "settings.timeLimitPerQuestion",
      translationKey: "builder.validation.timeLimitMinutesOutOfRange",
    };
  }
  const total = totalSecondsFromMinutesSeconds(ui.minutes, ui.seconds);
  if (total < 1) {
    return {
      field: "settings.timeLimitPerQuestion",
      translationKey: "builder.validation.timeLimitMustBePositive",
    };
  }
  if (total > TIME_LIMIT_SECONDS_MAX) {
    return {
      field: "settings.timeLimitPerQuestion",
      translationKey: "builder.validation.timeLimitMaxExceeded",
    };
  }
  return null;
}
