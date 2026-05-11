import type { BuilderTimeLimitUi } from "@/lib/time-limit-seconds";
import { parseTimeLimitSeconds } from "@/lib/time-limit-seconds";
import type { QuizBuilder } from "@/types/quiz-builder";

export type ValidationError = {
  field: string;
  translationKey: string;
  params?: Record<string, string | number>;
};

/** Errors shown in the quiz options panel (name + settings / time limit). */
export function hasQuizOptionsPanelErrors(errors: ValidationError[]): boolean {
  return errors.some(
    (error) => error.field === "name" || error.field.startsWith("settings."),
  );
}

export function validateQuiz(quiz: QuizBuilder): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!quiz.name.trim()) {
    errors.push({
      field: "name",
      translationKey: "builder.validation.quizNameRequired",
    });
  }

  quiz.questions.forEach((question, index) => {
    const questionPrefix = `questions[${index}]`;
    const questionNumber = index + 1;

    if (!question.label.trim()) {
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
    }

    if (question.type === "MULTIPLE_CHOICE" && correctAnswers !== 1) {
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

export function validateBuilderTimeLimit(ui: BuilderTimeLimitUi): ValidationError | null {
  if (!ui.enabled) {
    return null;
  }
  if (parseTimeLimitSeconds(ui.inputValue) === null) {
    return {
      field: "settings.timeLimitPerQuestion",
      translationKey: "builder.validation.timeLimitInvalid",
    };
  }
  return null;
}
