"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { QuizVisibility } from "@/types/quiz-builder";

type GenerationOptions = {
  questionType: string;
  maxQuestions: number;
  language: string;
  visibility: QuizVisibility;
  showAnswerImmediately: boolean;
  randomizeQuestions: boolean;
  timeLimitPerQuestion: number | null;
};

type GenerationOptionsModalProps = {
  options: GenerationOptions;
  onOptionsChange: (options: GenerationOptions) => void;
  disabledOptions?: string[];
  maxQuestionsLimit?: number;
  locale: Locale;
};

export function GenerationOptionsModal({
  options,
  onOptionsChange,
  disabledOptions = [],
  maxQuestionsLimit = 50,
  locale,
}: GenerationOptionsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localOptions, setLocalOptions] = useState(options);

  // Sync local options when props change
  useEffect(() => {
    setLocalOptions(options);
  }, [options]);

  const isDisabled = (option: string) => disabledOptions.includes(option);

  const handleSave = () => {
    onOptionsChange(localOptions);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalOptions(options);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">{t(locale, "generate.options")}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{t(locale, "options.title")}</DialogTitle>
            <DialogDescription>{t(locale, "options.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <h3 className="text-xl text-primary font-medium">{t(locale, "options.questionGeneration")}</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                {t(locale, "options.questionType")}
                {isDisabled("questionType") && (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </label>
              <Select
                value={localOptions.questionType}
                onValueChange={(value) =>
                  setLocalOptions({ ...localOptions, questionType: value })
                }
                disabled={isDisabled("questionType")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MIXED">{t(locale, "options.questionTypeMixed")}</SelectItem>
                  <SelectItem value="MCQ">{t(locale, "options.questionTypeMcq")}</SelectItem>
                  <SelectItem value="TRUE_FALSE">{t(locale, "options.questionTypeTrueFalse")}</SelectItem>
                </SelectContent>
              </Select>
              {isDisabled("questionType") && (
                <p className="text-xs text-muted-foreground">
                  {t(locale, "options.createAccountToCustomize")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t(locale, "options.maxQuestions")}</label>
              <Select
                value={localOptions.maxQuestions.toString()}
                onValueChange={(value) =>
                  setLocalOptions({
                    ...localOptions,
                    maxQuestions: parseInt(value, 10),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 15, 20, 30, 50]
                    .filter((n) => n <= maxQuestionsLimit)
                    .map((n) => (
                      <SelectItem key={n} value={n.toString()}>
                        {n} {t(locale, "options.questions")}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                {t(locale, "options.language")}
                {isDisabled("language") && (
                  <Lock className="h-3 w-3 text-muted-foreground" />
                )}
              </label>
              <Select
                value={localOptions.language}
                onValueChange={(value) =>
                  setLocalOptions({ ...localOptions, language: value })
                }
                disabled={isDisabled("language")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
              {isDisabled("language") && (
                <p className="text-xs text-muted-foreground">
                  {t(locale, "options.createAccountToChangeLanguage")}
                </p>
              )}
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="text-xl text-primary font-medium">{t(locale, "options.quizSettings")}</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t(locale, "options.visibility")}</label>
              <Select
                value={localOptions.visibility}
                onValueChange={(value) =>
                  setLocalOptions({
                    ...localOptions,
                    visibility: value as QuizVisibility,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATE">{t(locale, "options.private")}</SelectItem>
                  <SelectItem value="PUBLIC">{t(locale, "options.public")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <label className="text-sm font-medium">
                  {t(locale, "options.showAnswerImmediately")}
                </label>
                <InfoTooltip content={t(locale, "options.showAnswerDescription")} />
              </div>
              <Switch
                checked={localOptions.showAnswerImmediately}
                onCheckedChange={(checked) =>
                  setLocalOptions({
                    ...localOptions,
                    showAnswerImmediately: checked,
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <label className="text-sm font-medium">
                  {t(locale, "options.randomizeQuestions")}
                </label>
                <InfoTooltip content={t(locale, "options.randomizeDescription")} />
              </div>
              <Switch
                checked={localOptions.randomizeQuestions}
                onCheckedChange={(checked) =>
                  setLocalOptions({
                    ...localOptions,
                    randomizeQuestions: checked,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t(locale, "options.timeLimitPerQuestion")}
              </label>
              <Input
                type="number"
                min="0"
                value={localOptions.timeLimitPerQuestion || ""}
                onChange={(e) =>
                  setLocalOptions({
                    ...localOptions,
                    timeLimitPerQuestion: e.target.value
                      ? parseInt(e.target.value, 10)
                      : null,
                  })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleCancel}>
            {t(locale, "options.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave}>
            {t(locale, "options.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
