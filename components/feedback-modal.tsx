"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
import { submitFeedbackAction } from "@/app/feedback/actions";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import type { FeedbackType } from "@/lib/schemas/feedback.schema";

type FeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [type, setType] = useState<FeedbackType | "">("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const { showToast } = useToast();
  const { locale } = useLocale();

  // Reset form when modal opens/closes
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
      setError(t(locale, "feedback.validation.typeRequired"));
      return;
    }

    if (message.trim().length < 10) {
      setError(t(locale, "feedback.validation.messageTooShort"));
      return;
    }

    if (message.trim().length > 2000) {
      setError(t(locale, "feedback.validation.messageTooLong"));
      return;
    }

    setIsSubmitting(true);

    try {
      const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "";
      const page = pathname || "/";

      const result = await submitFeedbackAction({
        type: type as FeedbackType,
        message: message.trim(),
        page,
        userAgent,
      });

      if (!result.success) {
        const errorMessage = result.error.startsWith("errors.")
          ? t(locale, result.error as string)
          : result.error;
        setError(errorMessage);
        return;
      }

      showToast(t(locale, "feedback.success.message"), "success");
      onClose();
    } catch (err) {
      console.error("[FeedbackModal] Error submitting feedback:", err);
      setError(t(locale, "feedback.errors.submissionFailed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t(locale, "feedback.title")}</DialogTitle>
          <DialogDescription>{t(locale, "feedback.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-type">
              {t(locale, "feedback.form.type")} <span className="text-destructive">*</span>
            </Label>
            <Select value={type} onValueChange={(value) => setType(value as FeedbackType)}>
              <SelectTrigger id="feedback-type">
                <SelectValue placeholder={t(locale, "feedback.form.typePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUG">{t(locale, "feedback.types.bug")}</SelectItem>
                <SelectItem value="SUGGESTION">{t(locale, "feedback.types.suggestion")}</SelectItem>
                <SelectItem value="FEEDBACK">{t(locale, "feedback.types.feedback")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message">
              {t(locale, "feedback.form.message")} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              maxLength={2000}
            />
            <div className="text-xs text-muted-foreground text-right">
              {message.length}/2000
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t(locale, "feedback.form.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !type || message.trim().length < 10}
            isLoading={isSubmitting}
          >
            {t(locale, "feedback.form.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
