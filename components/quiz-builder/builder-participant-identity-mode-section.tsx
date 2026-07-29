"use client";

import type { Dispatch, SetStateAction } from "react";

import { ParticipantIdentityModeOptions } from "@/components/dashboard/participant-identity-mode-options";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { QuizBuilder } from "@/types/quiz-builder";
import type { ParticipantIdentityMode } from "@/types/participant-identity";

const SECTION_HEADING_ID = "builder-participant-identity-mode-heading";

export type BuilderParticipantIdentityModeSectionProps = {
  locale: Locale;
  quiz: QuizBuilder;
  setQuiz: Dispatch<SetStateAction<QuizBuilder>>;
};

export function BuilderParticipantIdentityModeSection({
  locale,
  quiz,
  setQuiz,
}: BuilderParticipantIdentityModeSectionProps) {
  const selectedMode: ParticipantIdentityMode =
    quiz.settings.participantIdentityMode ?? "ANONYMOUS";

  const handleSelect = (mode: ParticipantIdentityMode) => {
    if (mode === selectedMode) {
      return;
    }

    setQuiz((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        participantIdentityMode: mode,
      },
    }));
  };

  return (
    <section aria-labelledby={SECTION_HEADING_ID} className="space-y-4">
      <div className="space-y-1">
        <h3
          id={SECTION_HEADING_ID}
          className="text-xl font-semibold tracking-tight text-foreground"
        >
          {t(locale, "participantMode.sectionTitle")}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(locale, "participantMode.description")}
        </p>
      </div>

      <ParticipantIdentityModeOptions
        value={selectedMode}
        locale={locale}
        onSelect={handleSelect}
        descriptionVariant="full"
        ariaLabel={t(locale, "participantMode.sectionTitle")}
      />
    </section>
  );
}
