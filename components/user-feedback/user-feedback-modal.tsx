"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { submitUserFeedbackAction } from "@/app/feedback/actions";
import { StarRating } from "@/components/user-feedback/star-rating";
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
import type { FeedbackCategory } from "@/lib/schemas/feedback.schema";
import { FEEDBACK_CATEGORIES } from "@/lib/feedback/feedback-types";

const CATEGORY_I18N_KEYS: Record<FeedbackCategory, string> = {
  QUIZ_CREATION: "userFeedback.category.quizCreation",
  AI: "userFeedback.category.ai",
  SHARING: "userFeedback.category.sharing",
  RESULTS_STATS: "userFeedback.category.resultsStats",
  DESIGN: "userFeedback.category.design",
  OTHER: "userFeedback.category.other",
};

type UserFeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function UserFeedbackModal({ isOpen, onClose }: UserFeedbackModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [featureRequest, setFeatureRequest] = useState("");
  const [category, setCategory] = useState<FeedbackCategory | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const { showToast } = useToast();
  const { locale } = useLocale();

  useEffect(() => {
    if (!isOpen) {
      setRating(null);
      setMessage("");
      setFeatureRequest("");
      setCategory("");
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError(null);

    if (rating === null) {
      setError(t(locale, "userFeedback.error.ratingRequired"));
      return;
    }

    if (message.trim().length > 1500) {
      setError(t(locale, "userFeedback.error.messageTooLong"));
      return;
    }

    if (featureRequest.trim().length > 1500) {
      setError(t(locale, "userFeedback.error.featureRequestTooLong"));
      return;
    }

    setIsSubmitting(true);

    try {
      const userAgent = typeof window !== "undefined" ? window.navigator.userAgent : "";
      const page = pathname || "/";

      const result = await submitUserFeedbackAction({
        rating,
        message: message.trim() || undefined,
        featureRequest: featureRequest.trim() || undefined,
        category: category || undefined,
        page,
        userAgent,
      });

      if (!result.success) {
        const errorMessage = result.error.startsWith("errors.")
          ? t(locale, result.error)
          : result.error.startsWith("userFeedback.")
            ? t(locale, result.error)
            : result.error;
        setError(errorMessage);
        return;
      }

      showToast(t(locale, "userFeedback.success"), "success");
      onClose();
    } catch (err) {
      console.error("[UserFeedbackModal] Error submitting feedback:", err);
      setError(t(locale, "userFeedback.error.generic"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t(locale, "userFeedback.title")}</DialogTitle>
          <DialogDescription>{t(locale, "userFeedback.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label id="user-feedback-rating-label" htmlFor="user-feedback-rating">
              {t(locale, "userFeedback.ratingLabel")}{" "}
              <span className="text-destructive">*</span>
            </Label>
            <StarRating
              id="user-feedback-rating"
              value={rating}
              onChange={setRating}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-feedback-message">
              {t(locale, "userFeedback.messageLabel")}
            </Label>
            <Textarea
              id="user-feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t(locale, "userFeedback.messagePlaceholder")}
              rows={4}
              maxLength={1500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-feedback-feature-request">
              {t(locale, "userFeedback.featureRequestLabel")}
            </Label>
            <Textarea
              id="user-feedback-feature-request"
              value={featureRequest}
              onChange={(e) => setFeatureRequest(e.target.value)}
              placeholder={t(locale, "userFeedback.featureRequestPlaceholder")}
              rows={3}
              maxLength={1500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-feedback-category">
              {t(locale, "userFeedback.categoryLabel")}
            </Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as FeedbackCategory)}
            >
              <SelectTrigger id="user-feedback-category">
                <SelectValue placeholder={t(locale, "userFeedback.categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {FEEDBACK_CATEGORIES.map((categoryValue) => (
                  <SelectItem key={categoryValue} value={categoryValue}>
                    {t(locale, CATEGORY_I18N_KEYS[categoryValue])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t(locale, "userFeedback.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || rating === null}
            isLoading={isSubmitting}
          >
            {t(locale, "userFeedback.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
