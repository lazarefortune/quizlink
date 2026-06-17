"use client";

import { useEffect, useState } from "react";

import { updateQuizParticipantIdentityModeAction } from "@/app/(app)/dashboard/quiz/[quizId]/actions";
import { ParticipantIdentityModeFutureHint } from "@/components/dashboard/participant-identity-mode-future-hint";
import { ParticipantIdentityModeOptions } from "@/components/dashboard/participant-identity-mode-options";
import { useToast } from "@/components/ui/toast";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import {
  PARTICIPANT_IDENTITY_MODES,
  type ParticipantIdentityMode,
} from "@/types/participant-identity";

type ParticipantIdentityModeSelectorProps = {
  quizId: string;
  value: ParticipantIdentityMode;
  locale: Locale;
  disabled?: boolean;
  hasExistingResponses?: boolean;
  onUpdated?: (mode: ParticipantIdentityMode) => void;
};

export function ParticipantIdentityModeSelector({
  quizId,
  value,
  locale,
  disabled = false,
  hasExistingResponses = false,
  onUpdated,
}: ParticipantIdentityModeSelectorProps) {
  const { showToast } = useToast();
  const [selectedMode, setSelectedMode] = useState(value);
  const [pendingMode, setPendingMode] = useState<ParticipantIdentityMode | null>(null);

  useEffect(() => {
    setSelectedMode(value);
  }, [value]);

  const isBusy = pendingMode !== null;

  const handleSelect = async (mode: ParticipantIdentityMode) => {
    if (disabled || isBusy || mode === selectedMode) {
      return;
    }

    setPendingMode(mode);

    try {
      const result = await updateQuizParticipantIdentityModeAction(quizId, mode);
      if (!result.success) {
        showToast(t(locale, "participantMode.error"), "error");
        return;
      }

      setSelectedMode(result.participantIdentityMode);
      onUpdated?.(result.participantIdentityMode);
      showToast(t(locale, "participantMode.saved"), "success");
    } catch {
      showToast(t(locale, "participantMode.error"), "error");
    } finally {
      setPendingMode(null);
    }
  };

  return (
    <section className="space-y-4" aria-labelledby="participant-mode-heading">
      <div className="space-y-1">
        <h2 id="participant-mode-heading" className="text-xl font-semibold text-zinc-700 dark:text-zinc-300 text-foreground">
          {t(locale, "participantMode.title")}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t(locale, "participantMode.description")}
        </p>
      </div>

      <ParticipantIdentityModeOptions
        value={selectedMode}
        locale={locale}
        onSelect={(mode) => void handleSelect(mode)}
        pendingMode={pendingMode}
        disabled={disabled}
        descriptionVariant="full"
        ariaLabel={t(locale, "participantMode.title")}
      />

      <ParticipantIdentityModeFutureHint
        locale={locale}
        hasExistingResponses={hasExistingResponses}
      />

      <p className="sr-only">{PARTICIPANT_IDENTITY_MODES.join(", ")}</p>
    </section>
  );
}
