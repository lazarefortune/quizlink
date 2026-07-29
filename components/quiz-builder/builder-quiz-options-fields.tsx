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
import { removeValidationErrorsForField } from "@/lib/builder/builderValidationErrorFilters";
import type { QuizBuilder } from "@/types/quiz-builder";

export type BuilderQuizOptionsFieldsProps = {
  quiz: QuizBuilder;
  setQuiz: Dispatch<SetStateAction<QuizBuilder>>;
  timeLimitUi: BuilderTimeLimitUi;
  setTimeLimitUi: Dispatch<SetStateAction<BuilderTimeLimitUi>>;
  locale: Locale;
  getTimeLimitError: () => string | null;
  setValidationErrors: Dispatch<SetStateAction<ValidationError[]>>;
  /** When true, show the quiz name field (mobile sheet / desktop settings panel). */
  showNameField?: boolean;
  /** When false, hide switches and time limit (desktop settings panel title section). */
  showOptionFields?: boolean;
  /** Hide the inline label above the name input when a section heading is shown. */
  hideNameFieldLabel?: boolean;
  /** Links the name input to an external section heading via aria-labelledby. */
  nameFieldLabelledBy?: string;
  getNameError?: () => string | null;
  nameFieldId?: string;
  /** Overrides `quiz.name` for the input value (e.g. legacy sentinel → empty). */
  nameFieldValue?: string;
  autoFocusNameField?: boolean;
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
  showOptionFields = true,
  hideNameFieldLabel = false,
  nameFieldLabelledBy,
  getNameError,
  nameFieldId = "builder-quiz-name-sheet",
  nameFieldValue,
  autoFocusNameField = false,
}: BuilderQuizOptionsFieldsProps) {
  const nameError = showNameField && getNameError ? getNameError() : null;
  const displayedQuizName = nameFieldValue ?? quiz.name;
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
      removeValidationErrorsForField(prev, "settings.timeLimitPerQuestion"),
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
      {showNameField ? (
        <div className="space-y-2">
          {hideNameFieldLabel ? null : (
            <label htmlFor={nameFieldId} className="text-base font-medium text-foreground">
              {t(locale, "builder.quizNameCardLabel")}
            </label>
          )}
          <Input
            id={nameFieldId}
            data-builder-error-target="quiz-name"
            value={displayedQuizName}
            onChange={(e) => {
              setQuiz((prev) => ({ ...prev, name: e.target.value }));
              setValidationErrors((prev) => removeValidationErrorsForField(prev, "name"));
            }}
            placeholder={t(locale, "builder.quizNameInputPlaceholder")}
            maxLength={QUIZ_NAME_MAX_LENGTH}
            autoFocus={autoFocusNameField}
            className={cn(
              "text-base",
              nameError ? "border-destructive focus-visible:border-destructive" : "",
            )}
            aria-invalid={nameError !== null}
            aria-labelledby={
              hideNameFieldLabel && nameFieldLabelledBy ? nameFieldLabelledBy : undefined
            }
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
      {showOptionFields ? (
      <div className="space-y-3 sm:space-y-4">
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
              {t(locale, "builder.showCorrectionAfterEachQuestion")}
            </label>
            <InfoTooltip
              content={t(locale, "builder.showCorrectionAfterEachQuestionDescription")}
              className="shrink-0"
            />
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Switch
            checked={quiz.settings.showAnswersAtEnd ?? true}
            onCheckedChange={(checked: boolean) =>
              setQuiz({
                ...quiz,
                settings: {
                  ...quiz.settings,
                  showAnswersAtEnd: checked,
                },
              })
            }
            className="mt-0.5 shrink-0"
          />
          <div className="flex min-w-0 flex-1 items-start gap-1">
            <label className="flex-1 text-base font-medium wrap-break-word">
              {t(locale, "builder.showAnswersAtEnd")}
            </label>
            <InfoTooltip
              content={t(locale, "builder.showAnswersAtEndDescription")}
              className="shrink-0"
            />
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
                removeValidationErrorsForField(prev, "settings.timeLimitPerQuestion"),
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
                  data-builder-error-target="quiz-settings"
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
      ) : null}
    </>
  );
}
