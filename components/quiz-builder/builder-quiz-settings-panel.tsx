"use client";

import type { Dispatch, SetStateAction } from "react";
import { BuilderParticipantIdentityModeSection } from "@/components/quiz-builder/builder-participant-identity-mode-section";
import { BuilderQuizOptionsFields } from "@/components/quiz-builder/builder-quiz-options-fields";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { BuilderTimeLimitUi } from "@/lib/time-limit-seconds";
import type { ValidationError } from "@/lib/quiz-validation";
import type { QuizBuilder } from "@/types/quiz-builder";

const QUIZ_TITLE_SECTION_ID = "builder-quiz-title-section";
const QUIZ_OPTIONS_SECTION_ID = "builder-quiz-options-section";

export type BuilderQuizSettingsPanelProps = {
  locale: Locale;
  quiz: QuizBuilder;
  setQuiz: Dispatch<SetStateAction<QuizBuilder>>;
  timeLimitUi: BuilderTimeLimitUi;
  setTimeLimitUi: Dispatch<SetStateAction<BuilderTimeLimitUi>>;
  getTimeLimitError: () => string | null;
  getNameError: () => string | null;
  setValidationErrors: Dispatch<SetStateAction<ValidationError[]>>;
  nameFieldValue: string;
  autoFocusNameField?: boolean;
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
  nameFieldValue,
  autoFocusNameField = false,
}: BuilderQuizSettingsPanelProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      <h2 className="text-3xl font-semibold tracking-tight text-foreground">
        {t(locale, "builder.quizInfoPanelTitle")}
      </h2>

      <section aria-labelledby={QUIZ_TITLE_SECTION_ID} className="space-y-4">
        <h3
          id={QUIZ_TITLE_SECTION_ID}
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          {t(locale, "builder.quizTitleSectionTitle")}
        </h3>
        <BuilderQuizOptionsFields
          quiz={quiz}
          setQuiz={setQuiz}
          timeLimitUi={timeLimitUi}
          setTimeLimitUi={setTimeLimitUi}
          locale={locale}
          getTimeLimitError={getTimeLimitError}
          setValidationErrors={setValidationErrors}
          showNameField
          showOptionFields={false}
          hideNameFieldLabel
          nameFieldLabelledBy={QUIZ_TITLE_SECTION_ID}
          getNameError={getNameError}
          nameFieldId="builder-quiz-name-panel"
          nameFieldValue={nameFieldValue}
          autoFocusNameField={autoFocusNameField}
        />
      </section>

      <section aria-labelledby={QUIZ_OPTIONS_SECTION_ID} className="space-y-4">
        <h3
          id={QUIZ_OPTIONS_SECTION_ID}
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          {t(locale, "builder.quizOptionsSectionTitle")}
        </h3>
        <BuilderQuizOptionsFields
          quiz={quiz}
          setQuiz={setQuiz}
          timeLimitUi={timeLimitUi}
          setTimeLimitUi={setTimeLimitUi}
          locale={locale}
          getTimeLimitError={getTimeLimitError}
          setValidationErrors={setValidationErrors}
        />
      </section>

      <BuilderParticipantIdentityModeSection
        locale={locale}
        quiz={quiz}
        setQuiz={setQuiz}
      />
    </div>
  );
}
