"use client";

import type { Dispatch, SetStateAction } from "react";
import { BuilderQuizOptionsFields } from "@/components/quiz-builder/builder-quiz-options-fields";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { BuilderTimeLimitUi } from "@/lib/time-limit-seconds";
import type { ValidationError } from "@/lib/quiz-validation";
import type { QuizBuilder } from "@/types/quiz-builder";

export type BuilderQuizSettingsPanelProps = {
  locale: Locale;
  quiz: QuizBuilder;
  setQuiz: Dispatch<SetStateAction<QuizBuilder>>;
  timeLimitUi: BuilderTimeLimitUi;
  setTimeLimitUi: Dispatch<SetStateAction<BuilderTimeLimitUi>>;
  getTimeLimitError: () => string | null;
  getNameError: () => string | null;
  setValidationErrors: Dispatch<SetStateAction<ValidationError[]>>;
};

export function BuilderQuizSettingsPanel({
  locale,
  quiz,
  setQuiz,
  timeLimitUi,
  setTimeLimitUi,
  getTimeLimitError,
  getNameError,
  setValidationErrors,
}: BuilderQuizSettingsPanelProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          {t(locale, "builder.quizInfoPanelTitle")}
        </h2>
      </div>
      <BuilderQuizOptionsFields
        quiz={quiz}
        setQuiz={setQuiz}
        timeLimitUi={timeLimitUi}
        setTimeLimitUi={setTimeLimitUi}
        locale={locale}
        getTimeLimitError={getTimeLimitError}
        setValidationErrors={setValidationErrors}
        showNameField
        getNameError={getNameError}
        nameFieldId="builder-quiz-name-panel"
      />
    </div>
  );
}
