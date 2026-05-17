"use client";

import { type ComponentProps } from "react";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

import { CreateManualQuizNameDialog } from "./create-manual-quiz-name-dialog";
import { useCreateManualServerDraft } from "./use-create-manual-server-draft";

type ButtonProps = ComponentProps<typeof Button>;

export type CreateManualServerDraftButtonProps = Omit<
  ButtonProps,
  "onClick" | "type" | "disabled"
> & {
  disabled?: boolean;
  /** Runs after a successful navigation kick-off (router.push). */
  onCreated?: () => void;
};

export function CreateManualServerDraftButton({
  children,
  disabled = false,
  onCreated,
  ...buttonProps
}: CreateManualServerDraftButtonProps) {
  const { locale } = useLocale();
  const {
    isCreatingManualDraft,
    isNameDialogOpen,
    setNameDialogOpen,
    openManualDraftNameDialog,
    createManualServerDraftAndGoToBuilder,
  } = useCreateManualServerDraft();

  return (
    <>
      <Button
        type="button"
        {...buttonProps}
        disabled={disabled || isCreatingManualDraft}
        onClick={openManualDraftNameDialog}
      >
        {isCreatingManualDraft ? t(locale, "common.loading") : children}
      </Button>
      <CreateManualQuizNameDialog
        open={isNameDialogOpen}
        onOpenChange={setNameDialogOpen}
        isBusy={isCreatingManualDraft}
        onConfirm={(name) => {
          void createManualServerDraftAndGoToBuilder(name).then((ok) => {
            if (ok) {
              onCreated?.();
            }
          });
        }}
      />
    </>
  );
}

type CreateManualServerDraftSurfaceButtonProps = {
  children: React.ReactNode;
  className?: string;
  onCreated?: () => void;
};

/**
 * Unstyled clickable surface (e.g. wraps a Card) that creates a server DRAFT then navigates.
 */
export function CreateManualServerDraftSurfaceButton({
  children,
  className,
  onCreated,
}: CreateManualServerDraftSurfaceButtonProps) {
  const { locale } = useLocale();
  const {
    isCreatingManualDraft,
    isNameDialogOpen,
    setNameDialogOpen,
    openManualDraftNameDialog,
    createManualServerDraftAndGoToBuilder,
  } = useCreateManualServerDraft();

  return (
    <>
      <button
        type="button"
        disabled={isCreatingManualDraft}
        onClick={openManualDraftNameDialog}
        className={cn(
          "block w-full cursor-pointer rounded-2xl border-0 bg-transparent p-0 text-left transition-opacity",
          isCreatingManualDraft && "pointer-events-none opacity-70",
          className,
        )}
      >
        {isCreatingManualDraft ? (
          <span className="flex min-h-[4.5rem] items-center justify-center text-sm text-muted-foreground">
            {t(locale, "common.loading")}
          </span>
        ) : (
          children
        )}
      </button>
      <CreateManualQuizNameDialog
        open={isNameDialogOpen}
        onOpenChange={setNameDialogOpen}
        isBusy={isCreatingManualDraft}
        onConfirm={(name) => {
          void createManualServerDraftAndGoToBuilder(name).then((ok) => {
            if (ok) {
              onCreated?.();
            }
          });
        }}
      />
    </>
  );
}
