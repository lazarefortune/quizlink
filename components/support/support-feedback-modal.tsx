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

type SupportFeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function SupportFeedbackModal({ isOpen, onClose }: SupportFeedbackModalProps) {
  const [type, setType] = useState<FeedbackType | "">("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const { showToast } = useToast();
  const { locale } = useLocale();

  useEffect(() => {
    if (!isOpen) {
      setType("");
      setMessage("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError(null);

    if (!type) {
      setError(t(locale, "support.validation.typeRequired"));
      return;
    }

    if (message.trim().length < 5) {
      setError(t(locale, "support.validation.messageTooShort"));
      return;
    }

    if (message.trim().length > 1500) {
      setError(t(locale, "support.validation.messageTooLong"));
      return;
    }

    setIsSubmitting(true);

    try {
      const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "";
      const page = pathname || "/";

      const result = await createFeedbackAction({
        type: type as FeedbackType,
        message: message.trim(),
        page,
        userAgent,
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t(locale, "support.title")}</DialogTitle>
          <DialogDescription>{t(locale, "support.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="support-feedback-type">
              {t(locale, "support.form.typeLabel")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Select value={type} onValueChange={(value) => setType(value as FeedbackType)}>
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

          <div className="space-y-2">
            <Label htmlFor="support-feedback-message">
              {t(locale, "support.form.messageLabel")}{" "}
              <span className="text-destructive">*</span>
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
            disabled={isSubmitting || !type || message.trim().length < 5}
            isLoading={isSubmitting}
          >
            {t(locale, "support.form.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
