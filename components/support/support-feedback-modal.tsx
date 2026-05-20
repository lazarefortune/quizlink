"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { createFeedbackAction } from "@/app/feedback/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import type { FeedbackType } from "@/lib/schemas/feedback.schema";
import {
  sanitizeSupportFeedbackMetadata,
  type SupportFeedbackPreset,
} from "@/components/support/support-feedback-preset";

const CLASSIC_SUPPORT_TYPES = ["BUG", "SUGGESTION", "FEEDBACK"] as const;
type ClassicSupportType = (typeof CLASSIC_SUPPORT_TYPES)[number];

type SupportFeedbackModalProps = {
  isOpen: boolean;
  preset: SupportFeedbackPreset | null;
  onClose: () => void;
};

function isClassicSupportType(value: string): value is ClassicSupportType {
  return CLASSIC_SUPPORT_TYPES.includes(value as ClassicSupportType);
}

export function SupportFeedbackModal({
  isOpen,
  preset,
  onClose,
}: SupportFeedbackModalProps) {
  const [type, setType] = useState<FeedbackType | "">("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const { showToast } = useToast();
  const { locale } = useLocale();

  const isSaveErrorReportPreset = preset?.type === "SAVE_ERROR_REPORT";
  const isSaveErrorReport = type === "SAVE_ERROR_REPORT" || isSaveErrorReportPreset;
  const presetMetadata = sanitizeSupportFeedbackMetadata(preset?.metadata);

  useEffect(() => {
    if (!isOpen) {
      setType("");
      setMessage("");
      setError(null);
      return;
    }

    if (preset) {
      setType(preset.type);
      setMessage(preset.message ?? "");
      setError(null);
    }
  }, [isOpen, preset]);

  const handleSubmit = async () => {
    setError(null);

    if (!type) {
      setError(t(locale, "support.validation.typeRequired"));
      return;
    }

    const trimmedMessage = message.trim();
    const hasMetadata = presetMetadata !== undefined && Object.keys(presetMetadata).length > 0;

    if (isSaveErrorReport) {
      if (trimmedMessage.length > 1500) {
        setError(t(locale, "support.validation.messageTooLong"));
        return;
      }

      if (trimmedMessage.length > 0 && trimmedMessage.length < 5) {
        setError(t(locale, "support.validation.messageTooShort"));
        return;
      }

      if (trimmedMessage.length === 0 && !hasMetadata) {
        setError(t(locale, "support.validation.messageOrMetadataRequired"));
        return;
      }
    } else {
      if (trimmedMessage.length < 5) {
        setError(t(locale, "support.validation.messageTooShort"));
        return;
      }

      if (trimmedMessage.length > 1500) {
        setError(t(locale, "support.validation.messageTooLong"));
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "";
      const page = pathname || "/";

      const result = await createFeedbackAction({
        type: type as FeedbackType,
        message: trimmedMessage || undefined,
        page,
        userAgent,
        quizId: preset?.quizId,
        metadata: isSaveErrorReport ? presetMetadata : undefined,
      });

      if (!result.success) {
        const errorMessage = result.error.startsWith("errors.")
          ? t(locale, result.error)
          : result.error;
        setError(errorMessage);
        return;
      }

      showToast(t(locale, "support.success.sent"), "success");
      onClose();
    } catch (err) {
      console.error("[SupportFeedbackModal] Error submitting feedback:", err);
      setError(t(locale, "support.errors.sendFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = (() => {
    if (!type || isSubmitting) {
      return false;
    }

    const trimmedMessage = message.trim();

    if (isSaveErrorReport) {
      const hasMetadata =
        presetMetadata !== undefined && Object.keys(presetMetadata).length > 0;
      if (trimmedMessage.length === 0) {
        return hasMetadata;
      }
      return trimmedMessage.length >= 5;
    }

    return trimmedMessage.length >= 5;
  })();

  const dialogTitle = isSaveErrorReport
    ? t(locale, "support.reportIssue")
    : t(locale, "support.title");

  const dialogDescription = isSaveErrorReport
    ? t(locale, "support.errorReportDescription")
    : t(locale, "support.description");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isSaveErrorReportPreset ? (
            <p className="text-sm text-muted-foreground">
              {t(locale, "support.metadataAttached")}
            </p>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="support-feedback-type">
                {t(locale, "support.form.typeLabel")}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  if (isClassicSupportType(value)) {
                    setType(value);
                  }
                }}
              >
                <SelectTrigger id="support-feedback-type">
                  <SelectValue placeholder={t(locale, "support.form.typePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BUG">{t(locale, "support.types.bug")}</SelectItem>
                  <SelectItem value="SUGGESTION">
                    {t(locale, "support.types.suggestion")}
                  </SelectItem>
                  <SelectItem value="FEEDBACK">
                    {t(locale, "support.types.questionFeedback")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="support-feedback-message">
              {t(locale, "support.form.messageLabel")}{" "}
              {isSaveErrorReport ? null : <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              id="support-feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t(locale, "support.form.messagePlaceholder")}
              rows={6}
              maxLength={1500}
            />
            <div className="text-right text-xs text-muted-foreground">
              {message.length}/1500
            </div>
          </div>

          {error ? (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t(locale, "support.form.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            isLoading={isSubmitting}
          >
            {t(locale, "support.form.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
