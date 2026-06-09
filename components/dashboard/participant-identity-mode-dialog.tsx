"use client";

import { useEffect, useState } from "react";

import { updateQuizParticipantIdentityModeAction } from "@/app/(app)/dashboard/quiz/[quizId]/actions";
import { ParticipantIdentityModeFutureHint } from "@/components/dashboard/participant-identity-mode-future-hint";
import { ParticipantIdentityModeOptions } from "@/components/dashboard/participant-identity-mode-options";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { ParticipantIdentityMode } from "@/types/participant-identity";

type ParticipantIdentityModeDialogProps = {
  quizId: string;
  value: ParticipantIdentityMode;
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasExistingResponses?: boolean;
  onUpdated?: (mode: ParticipantIdentityMode) => void;
};

export function ParticipantIdentityModeDialog({
  quizId,
  value,
  locale,
  open,
  onOpenChange,
  hasExistingResponses = false,
  onUpdated,
}: ParticipantIdentityModeDialogProps) {
  const { showToast } = useToast();
  const [draftMode, setDraftMode] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDraftMode(value);
    }
  }, [open, value]);

  const handleSave = async () => {
    if (isSaving || draftMode === value) {
      onOpenChange(false);
      return;
    }

    setIsSaving(true);
    try {
      const result = await updateQuizParticipantIdentityModeAction(quizId, draftMode);
      if (!result.success) {
        showToast(t(locale, "participantMode.error"), "error");
        return;
      }

      onUpdated?.(result.participantIdentityMode);
      showToast(t(locale, "participantMode.saved"), "success");
      onOpenChange(false);
    } catch {
      showToast(t(locale, "participantMode.error"), "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" data-testid="participant-identity-mode-dialog">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{t(locale, "participantMode.chooseTitle")}</DialogTitle>
        </DialogHeader>

        <ParticipantIdentityModeOptions
          value={draftMode}
          locale={locale}
          onSelect={setDraftMode}
          disabled={isSaving}
          descriptionVariant="full"
          ariaLabel={t(locale, "participantMode.chooseTitle")}
        />

        <ParticipantIdentityModeFutureHint
          locale={locale}
          hasExistingResponses={hasExistingResponses}
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
          >
            {t(locale, "participantMode.cancel")}
          </Button>
          <Button type="button" variant="blue" disabled={isSaving} onClick={() => void handleSave()}>
            {t(locale, "participantMode.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
