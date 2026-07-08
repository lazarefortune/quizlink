"use client";

import { useState } from "react";
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
import { Lock, Settings2, Sliders } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { InfoTooltip } from "@/components/ui/info-tooltip";
import { useToast } from "@/components/ui/toast";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

type GenerationOptions = {
  questionType: string;
  maxQuestions: number;
  language: string;
  showAnswerImmediately: boolean;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
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
  const { showToast } = useToast();

  const isDisabled = (option: string) => disabledOptions.includes(option);
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setLocalOptions(options);
    }
  };

  const handleSave = () => {
    onOptionsChange(localOptions);
    setIsOpen(false);
    showToast(t(locale, "options.saved"), "success");
  };

  const handleCancel = () => {
    setLocalOptions(options);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="default" className="gap-2">
          <Settings2 className="h-4 w-4" />
          {t(locale, "generate.options")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            {t(locale, "options.title")}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {t(locale, "options.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              {t(locale, "options.questionType")}
              {isDisabled("questionType") && <Lock className="h-3 w-3" />}
            </Label>
            <Select
              value={localOptions.questionType}
              onValueChange={(value) =>
                setLocalOptions({ ...localOptions, questionType: value })
              }
              disabled={isDisabled("questionType")}
            >
              <SelectTrigger className="rounded-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MIXED">
                  {t(locale, "options.questionTypeMixed")}
                </SelectItem>
                <SelectItem value="MCQ">
                  {t(locale, "options.questionTypeMcq")}
                </SelectItem>
                <SelectItem value="TRUE_FALSE">
                  {t(locale, "options.questionTypeTrueFalse")}
                </SelectItem>
              </SelectContent>
            </Select>
            {isDisabled("questionType") && (
              <p className="text-xs text-muted-foreground">
                {t(locale, "options.createAccountToCustomize")}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              {t(locale, "options.maxQuestions")}{" "}
              <span className="text-muted-foreground font-normal">
                (1–{maxQuestionsLimit})
              </span>
            </Label>
            <Input
              type="number"
              min={1}
              max={maxQuestionsLimit}
              className="rounded-sm"
              value={localOptions.maxQuestions}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") return;
                const num = parseInt(raw, 10);
                if (Number.isNaN(num)) return;
                const clamped = Math.min(
                  maxQuestionsLimit,
                  Math.max(1, num)
                );
                setLocalOptions({
                  ...localOptions,
                  maxQuestions: clamped,
                });
              }}
              onBlur={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setLocalOptions({
                    ...localOptions,
                    maxQuestions: 1,
                  });
                  return;
                }
                const num = parseInt(raw, 10);
                const clamped = Math.min(
                  maxQuestionsLimit,
                  Math.max(1, Number.isNaN(num) ? 1 : num)
                );
                if (clamped !== localOptions.maxQuestions) {
                  setLocalOptions({
                    ...localOptions,
                    maxQuestions: clamped,
                  });
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium flex items-center gap-1.5">
              {t(locale, "options.language")}
              {isDisabled("language") && <Lock className="h-3 w-3" />}
            </Label>
            <Select
              value={localOptions.language}
              onValueChange={(value) =>
                setLocalOptions({ ...localOptions, language: value })
              }
              disabled={isDisabled("language")}
            >
              <SelectTrigger className="rounded-sm">
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

          <div className="border-t border-border pt-4 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Label className="text-sm font-medium truncate">
                  {t(locale, "options.showAnswerImmediately")}
                </Label>
                <InfoTooltip
                  content={t(locale, "options.showAnswerDescription")}
                />
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

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Label className="text-sm font-medium truncate">
                  {t(locale, "options.randomizeQuestions")}
                </Label>
                <InfoTooltip
                  content={t(locale, "options.randomizeDescription")}
                />
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

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Label className="text-sm font-medium truncate">
                  {t(locale, "options.randomizeOptions")}
                </Label>
                <InfoTooltip
                  content={t(locale, "options.randomizeOptionsDescription")}
                />
              </div>
              <Switch
                checked={localOptions.randomizeOptions}
                onCheckedChange={(checked) =>
                  setLocalOptions({
                    ...localOptions,
                    randomizeOptions: checked,
                  })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {t(locale, "options.timeLimitPerQuestion")}
              </Label>
              <Input
                type="number"
                min="0"
                placeholder={t(locale, "options.timeLimitPlaceholder")}
                className="rounded-lg"
                value={localOptions.timeLimitPerQuestion ?? ""}
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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleCancel}>
            {t(locale, "options.cancel")}
          </Button>
          <Button variant="primary" onClick={handleSave} className="rounded-lg">
            {t(locale, "options.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
