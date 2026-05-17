"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { QUIZ_NAME_MAX_LENGTH } from "@/lib/quiz-validation";

export type CreateManualQuizNameDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isBusy: boolean;
  onConfirm: (trimmedName: string) => void;
};

export function CreateManualQuizNameDialog({
  open,
  onOpenChange,
  isBusy,
  onConfirm,
}: CreateManualQuizNameDialogProps) {
  const { locale } = useLocale();
  const inputId = useId();
  const [name, setName] = useState("");
  const [showRequiredError, setShowRequiredError] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setShowRequiredError(false);
    }
  }, [open]);

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setShowRequiredError(true);
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-auto max-w-sm">
        <DialogHeader>
          <DialogTitle>{t(locale, "builder.manualDraftNameDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t(locale, "builder.manualDraftNameDialogDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <label htmlFor={inputId} className="sr-only">
            {t(locale, "builder.quizNameCardLabel")}
          </label>
          <Input
            id={inputId}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (showRequiredError && event.target.value.trim().length > 0) {
                setShowRequiredError(false);
              }
            }}
            placeholder={t(locale, "builder.manualDraftNamePlaceholder")}
            maxLength={QUIZ_NAME_MAX_LENGTH}
            autoComplete="off"
            disabled={isBusy}
            aria-invalid={showRequiredError}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleConfirm();
              }
            }}
          />
          {showRequiredError ? (
            <p className="text-sm text-destructive">{t(locale, "builder.quizNameRequired")}</p>
          ) : null}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            className="w-full sm:w-auto"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
          >
            {t(locale, "builder.cancel")}
          </Button>
          <Button
            type="button"
            variant="blue"
            className="w-full sm:w-auto"
            disabled={isBusy}
            onClick={handleConfirm}
          >
            {isBusy ? t(locale, "common.loading") : t(locale, "builder.manualDraftNameConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
