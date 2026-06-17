"use client";

import { useEffect, useState } from "react";

import { ParticipantIdentityModeDialog } from "@/components/dashboard/participant-identity-mode-dialog";
import { Button } from "@/components/ui/button";
import { PlayfulSectionTitle } from "@/components/ui/playful-section-title";
import { getParticipantIdentityModeOption } from "@/lib/dashboard/participant-identity-mode-meta";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { ParticipantIdentityMode } from "@/types/participant-identity";

type ParticipantIdentityModeSummaryCardProps = {
  quizId: string;
  value: ParticipantIdentityMode;
  locale: Locale;
  hasExistingResponses?: boolean;
  onUpdated?: (mode: ParticipantIdentityMode) => void;
};

export function ParticipantIdentityModeSummaryCard({
  quizId,
  value,
  locale,
  hasExistingResponses = false,
  onUpdated,
}: ParticipantIdentityModeSummaryCardProps) {
  const [currentMode, setCurrentMode] = useState(value);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    setCurrentMode(value);
  }, [value]);

  const option = getParticipantIdentityModeOption(currentMode);
  const Icon = option.icon;

  const handleUpdated = (mode: ParticipantIdentityMode) => {
    setCurrentMode(mode);
    onUpdated?.(mode);
  };

  return (
    <>
      <section data-testid="participant-identity-mode-summary" className="space-y-3">
        <div className="space-y-1">
          <PlayfulSectionTitle className="text-2xl font-semibold text-zinc-700 dark:text-zinc-300">
            {t(locale, "participantMode.sectionTitle")}
          </PlayfulSectionTitle>
          <p className="text-base leading-relaxed text-muted-foreground">
            {t(locale, "participantMode.description")}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `color-mix(in srgb, var(${option.playfulColors.softCssVar}) 35%, transparent)`,
                }}
              >
                <Icon className="h-7 w-7" />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-0">
                  {t(locale, option.labelKey)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(locale, option.shortDescriptionKey)}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => setDialogOpen(true)}
            >
              {t(locale, "participantMode.edit")}
            </Button>
          </div>
        </div>
      </section>

      <ParticipantIdentityModeDialog
        quizId={quizId}
        value={currentMode}
        locale={locale}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        hasExistingResponses={hasExistingResponses}
        onUpdated={handleUpdated}
      />
    </>
  );
}
