"use client";

import type { Dispatch, SetStateAction } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  isValidBuilderTimeLimitParts,
  totalSecondsFromMinutesSeconds,
  TIME_LIMIT_MINUTES_MAX,
  type BuilderTimeLimitUi,
} from "@/lib/time-limit-seconds";
import { QUIZ_NAME_MAX_LENGTH, type ValidationError } from "@/lib/quiz-validation";
import type { QuizBuilder } from "@/types/quiz-builder";

export type BuilderQuizOptionsFieldsProps = {
  quiz: QuizBuilder;
  setQuiz: Dispatch<SetStateAction<QuizBuilder>>;
  timeLimitUi: BuilderTimeLimitUi;
  setTimeLimitUi: Dispatch<SetStateAction<BuilderTimeLimitUi>>;
  locale: Locale;
  getTimeLimitError: () => string | null;
  setValidationErrors: Dispatch<SetStateAction<ValidationError[]>>;
  /** When true, show the quiz name field (mobile sheet). Desktop keeps inline title in the builder header. */
  showNameField?: boolean;
  getNameError?: () => string | null;
};

export function BuilderQuizOptionsFields({
  quiz,
  setQuiz,
  timeLimitUi,
  setTimeLimitUi,
  locale,
  getTimeLimitError,
  setValidationErrors,
  showNameField = false,
  getNameError,
}: BuilderQuizOptionsFieldsProps) {
  const nameError = showNameField && getNameError ? getNameError() : null;
  const applyTimeLimitParts = (minutes: number, seconds: number) => {
    const m = Math.min(Math.max(Math.trunc(minutes), 0), TIME_LIMIT_MINUTES_MAX);
    const s = Math.min(Math.max(Math.trunc(seconds), 0), 59);
    setTimeLimitUi({ enabled: true, minutes: m, seconds: s });
    const total = totalSecondsFromMinutesSeconds(m, s);
    setQuiz((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        timeLimitPerQuestion: isValidBuilderTimeLimitParts(m, s)
          ? total
          : prev.settings.timeLimitPerQuestion,
      },
    }));
    setValidationErrors((prev) =>
      prev.filter((err) => err.field !== "settings.timeLimitPerQuestion"),
    );
  };

  const formatDurationPhrase = (minutes: number, seconds: number): string => {
    if (minutes === 0) {
      return t(locale, "builder.timeLimitDurationSecondsOnly", { n: seconds });
    }
    if (seconds === 0) {
      return t(locale, "builder.timeLimitDurationMinutesOnly", { n: minutes });
    }
    return t(locale, "builder.timeLimitDurationMixed", { minutes, seconds });
  };

  return (
    <>
      <div className="space-y-3 sm:space-y-4">
        {showNameField ? (
          <div className="space-y-2 border-b border-border/60 pb-4">
            <label htmlFor="builder-quiz-name-sheet" className="text-base font-medium text-foreground">
              {t(locale, "builder.quizNameCardLabel")}
            </label>
            <Input
              id="builder-quiz-name-sheet"
              value={quiz.name}
              onChange={(e) => {
                setQuiz((prev) => ({ ...prev, name: e.target.value }));
                setValidationErrors((prev) => prev.filter((err) => err.field !== "name"));
              }}
              placeholder={t(locale, "builder.quizNameInputPlaceholder")}
              maxLength={QUIZ_NAME_MAX_LENGTH}
              className={cn(
                "text-base",
                nameError ? "border-destructive focus-visible:border-destructive" : "",
              )}
              aria-invalid={nameError !== null}
              autoComplete="off"
            />
            {nameError ? (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {nameError}
              </p>
            ) : null}
          </div>
        ) : null}
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
            <label className="flex-1 text-base font-medium wrap-break-word">
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
            <label className="flex-1 text-base font-medium wrap-break-word">
              {t(locale, "builder.randomizeQuestions")}
            </label>
            <InfoTooltip content={t(locale, "builder.randomizeDescription")} className="shrink-0" />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Switch
            checked={quiz.settings.randomizeOptions}
            onCheckedChange={(checked: boolean) =>
              setQuiz({
                ...quiz,
                settings: {
                  ...quiz.settings,
                  randomizeOptions: checked,
                },
              })
            }
            className="mt-0.5 shrink-0"
          />
          <div className="flex min-w-0 flex-1 items-start gap-1">
            <label className="flex-1 text-base font-medium wrap-break-word">
              {t(locale, "builder.randomizeOptions")}
            </label>
            <InfoTooltip content={t(locale, "builder.randomizeOptionsDescription")} className="shrink-0" />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Switch
            checked={timeLimitUi.enabled}
            onCheckedChange={(checked: boolean) => {
              setTimeLimitUi(
                checked ? { enabled: true, minutes: 0, seconds: 30 } : { enabled: false, minutes: 0, seconds: 0 },
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
            <label className="flex-1 text-base font-medium wrap-break-word">
              {t(locale, "builder.timeLimitPerQuestion")}
            </label>
          </div>
        </div>

        {timeLimitUi.enabled && (
          <div className="space-y-3 border border-border/70 rounded-lg bg-muted/20 p-4">
            <p className="text-base font-semibold text-foreground">{t(locale, "builder.timeLimitSectionTitle")}</p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="space-y-1">
                <label htmlFor="builder-time-limit-minutes" className="text-base text-muted-foreground">
                  {t(locale, "builder.timeLimitMinutesLabel")}
                </label>
                <Input
                  id="builder-time-limit-minutes"
                  type="number"
                  min={0}
                  max={TIME_LIMIT_MINUTES_MAX}
                  step={1}
                  inputMode="numeric"
                  value={timeLimitUi.minutes}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const next =
                      raw === "" ? 0 : Math.min(Math.max(parseInt(raw, 10) || 0, 0), TIME_LIMIT_MINUTES_MAX);
                    applyTimeLimitParts(next, timeLimitUi.seconds);
                  }}
                  className={cn(
                    "w-[5.5rem] text-sm tabular-nums",
                    getTimeLimitError() ? "border-destructive focus-visible:border-destructive" : "",
                  )}
                  aria-invalid={getTimeLimitError() !== null}
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="builder-time-limit-seconds" className="text-base text-muted-foreground">
                  {t(locale, "builder.timeLimitSecondsLabel")}
                </label>
                <Input
                  id="builder-time-limit-seconds"
                  type="number"
                  min={0}
                  max={59}
                  step={1}
                  inputMode="numeric"
                  value={timeLimitUi.seconds}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const next = raw === "" ? 0 : Math.min(Math.max(parseInt(raw, 10) || 0, 0), 59);
                    applyTimeLimitParts(timeLimitUi.minutes, next);
                  }}
                  className={cn(
                    "w-[5.5rem] text-sm tabular-nums",
                    getTimeLimitError() ? "border-destructive focus-visible:border-destructive" : "",
                  )}
                  aria-invalid={getTimeLimitError() !== null}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-base text-muted-foreground">{t(locale, "builder.timeLimitPresetsLabel")}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => applyTimeLimitParts(0, 15)}
                >
                  {t(locale, "builder.timeLimitPreset15")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => applyTimeLimitParts(0, 30)}
                >
                  {t(locale, "builder.timeLimitPreset30")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => applyTimeLimitParts(0, 45)}
                >
                  {t(locale, "builder.timeLimitPreset45")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => applyTimeLimitParts(1, 0)}
                >
                  {t(locale, "builder.timeLimitPreset1min")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-9"
                  onClick={() => applyTimeLimitParts(2, 0)}
                >
                  {t(locale, "builder.timeLimitPreset2min")}
                </Button>
              </div>
            </div>

            {isValidBuilderTimeLimitParts(timeLimitUi.minutes, timeLimitUi.seconds) ? (
              <p className="text-sm text-muted-foreground">
                {t(locale, "builder.timeLimitSummary", {
                  duration: formatDurationPhrase(timeLimitUi.minutes, timeLimitUi.seconds),
                })}
              </p>
            ) : null}

            {getTimeLimitError() ? (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertCircle className="h-3 w-3 shrink-0" />
                {getTimeLimitError()}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </>
  );
}
