"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Plus } from "@hugeicons/core-free-icons";

import {
  CreateQuizAiIcon,
  CreateQuizManualIcon,
} from "@/components/dashboard/create-quiz-modal-icons";
import { useCreateManualServerDraft } from "@/components/dashboard/use-create-manual-server-draft";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type CreateQuizModalTriggerProps = {
  locale: Locale;
  variant?: "blue" | "primary";
  size?: ButtonProps["size"];
  label?: string;
  className?: string;
  icon?: ReactNode;
};

export function CreateQuizModalTrigger({
  locale,
  variant = "primary",
  size = "sm",
  label,
  className,
  icon,
}: CreateQuizModalTriggerProps) {
  const [open, setOpen] = useState(false);
  const { isCreatingManualDraft, createManualServerDraftAndGoToBuilder } =
    useCreateManualServerDraft();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={cn(
          "gap-2 items-center text-lg",
          className,
        )}
        onClick={() => setOpen(true)}
      >
        {icon ?? <HugeiconsIcon icon={Plus} strokeWidth={2.5} />}
        {label ? (
          label
        ) : (
          <>
            <span className="sm:hidden">{t(locale, "nav.create")}</span>
            <span className="hidden sm:inline normal-case">
              {t(locale, "dashboard.welcome.createQuiz")}
            </span>
          </>
        )}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-sm rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold sm:text-2xl">
              {locale === "fr" ? "Crée ton quiz !" : "Create your quiz!"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-1 pb-1">
            <button
              type="button"
              disabled={isCreatingManualDraft}
              onClick={() => {
                handleOpenChange(false);
                void createManualServerDraftAndGoToBuilder();
              }}
              className="group flex flex-col items-center gap-2.5 rounded-xl border-2 border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60 sm:gap-3 sm:p-5"
            >
              <CreateQuizManualIcon className="h-12 w-12 sm:h-14 sm:w-14" />
              <p className="text-center font-fredoka text-base font-semibold leading-snug sm:text-lg">
                {isCreatingManualDraft
                  ? t(locale, "common.loading")
                  : t(locale, "nav.createManually")}
              </p>
            </button>
            <Link
              href="/generate"
              onClick={() => setOpen(false)}
              className="group flex flex-col items-center gap-2.5 rounded-xl border-2 border-border bg-card p-4 transition-all hover:border-blue hover:shadow-md active:scale-[0.97] sm:gap-3 sm:p-5"
            >
              <CreateQuizAiIcon className="h-12 w-12 sm:h-14 sm:w-14" />
              <p className="text-center font-fredoka text-base font-semibold leading-snug sm:text-lg">
                {t(locale, "nav.createWithAI")}
              </p>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
