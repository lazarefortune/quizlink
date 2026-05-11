"use client";

import type { Dispatch, SetStateAction } from "react";
import { AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { Textarea } from "@/components/ui/textarea";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  parseTimeLimitSeconds,
  TIME_LIMIT_SECONDS_MAX,
  type BuilderTimeLimitUi,
} from "@/lib/time-limit-seconds";
import type { QuizBuilder } from "@/types/quiz-builder";
import type { ValidationError } from "@/lib/quiz-validation";

export type BuilderQuizOptionsFieldsProps = {
  quiz: QuizBuilder;
  setQuiz: Dispatch<SetStateAction<QuizBuilder>>;
  timeLimitUi: BuilderTimeLimitUi;
  setTimeLimitUi: Dispatch<SetStateAction<BuilderTimeLimitUi>>;
  locale: Locale;
  getNameError: () => string | null;
  getTimeLimitError: () => string | null;
  setValidationErrors: Dispatch<SetStateAction<ValidationError[]>>;
};

export function BuilderQuizOptionsFields({
  quiz,
  setQuiz,
  timeLimitUi,
  setTimeLimitUi,
  locale,
  getNameError,
  getTimeLimitError,
  setValidationErrors,
}: BuilderQuizOptionsFieldsProps) {
  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        <div className="space-y-1.5 sm:space-y-2">
          <label className="text-sm font-medium">
            {t(locale, "builder.quizName")}
          </label>
          <div className="space-y-1">
            <Textarea
              value={quiz.name}
              onChange={(e) => {
                setQuiz({ ...quiz, name: e.target.value });
                setValidationErrors((prev) => prev.filter((err) => err.field !== "name"));
              }}
              required
              className={cn(
                "text-base",
                getNameError() ? "border-destructive focus-visible:border-destructive" : "",
              )}
            />
            {getNameError() && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3" />
                {getNameError()}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-3 border-t border-border/60 pt-3 sm:space-y-4 sm:pt-4">
        <div className="flex items-start gap-2">
          <Switch
            checked={quiz.settings.showAnswerImmediately}
            onCheckedChange={(checked: boolean) =>
              setQuiz({
                ...quiz,
                settings: {
                  ...quiz.settings,
                  showAnswerImmediately: checked,
                },
              })
            }
            className="mt-0.5 shrink-0"
          />
          <div className="flex min-w-0 flex-1 items-start gap-1">
            <label className="flex-1 text-sm font-medium wrap-break-word">
              {t(locale, "builder.showAnswerImmediately")}
            </label>
            <InfoTooltip content={t(locale, "builder.showAnswerDescription")} className="shrink-0" />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Switch
            checked={quiz.settings.randomizeQuestions}
            onCheckedChange={(checked: boolean) =>
              setQuiz({
                ...quiz,
                settings: {
                  ...quiz.settings,
                  randomizeQuestions: checked,
                },
              })
            }
            className="mt-0.5 shrink-0"
          />
          <div className="flex min-w-0 flex-1 items-start gap-1">
            <label className="flex-1 text-sm font-medium wrap-break-word">
              {t(locale, "builder.randomizeQuestions")}
            </label>
            <InfoTooltip content={t(locale, "builder.randomizeDescription")} className="shrink-0" />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Switch
            checked={timeLimitUi.enabled}
            onCheckedChange={(checked: boolean) => {
              setTimeLimitUi(
                checked ? { enabled: true, inputValue: "30" } : { enabled: false, inputValue: "" },
              );
              setQuiz({
                ...quiz,
                settings: {
                  ...quiz.settings,
                  timeLimitPerQuestion: checked ? 30 : null,
                },
              });
              setValidationErrors((prev) =>
                prev.filter((err) => err.field !== "settings.timeLimitPerQuestion"),
              );
            }}
            className="mt-0.5 shrink-0"
          />
          <div className="flex min-w-0 flex-1 items-start gap-1">
            <label className="flex-1 text-sm font-medium wrap-break-word">
              {t(locale, "builder.timeLimitPerQuestion")}
            </label>
            <InfoTooltip content={t(locale, "options.timeLimitPlaceholder")} className="shrink-0" />
          </div>
        </div>

        {timeLimitUi.enabled && (
          <div className="space-y-1 pl-0 sm:pl-4">
            <Input
              type="number"
              min={1}
              max={TIME_LIMIT_SECONDS_MAX}
              value={timeLimitUi.inputValue}
              onChange={(e) => {
                const raw = e.target.value;
                setTimeLimitUi((prev) => ({ ...prev, inputValue: raw }));
                const parsed = parseTimeLimitSeconds(raw);
                setQuiz((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    timeLimitPerQuestion:
                      parsed !== null ? parsed : prev.settings.timeLimitPerQuestion,
                  },
                }));
                setValidationErrors((prev) =>
                  prev.filter((err) => err.field !== "settings.timeLimitPerQuestion"),
                );
              }}
              className={cn(
                "w-full text-sm",
                getTimeLimitError() ? "border-destructive focus-visible:border-destructive" : "",
              )}
              aria-invalid={getTimeLimitError() !== null}
            />
            {getTimeLimitError() && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {getTimeLimitError()}
              </p>
            )}
          </div>
        )}
      </div>
    </>
  );
}
