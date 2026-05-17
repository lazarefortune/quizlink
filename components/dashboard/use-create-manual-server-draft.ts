"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { createDraftQuizAction } from "@/app/(app)/dashboard/create/actions";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

export function useCreateManualServerDraft(): {
  isCreatingManualDraft: boolean;
  isNameDialogOpen: boolean;
  setNameDialogOpen: (open: boolean) => void;
  openManualDraftNameDialog: () => void;
  createManualServerDraftAndGoToBuilder: (trimmedName: string) => Promise<boolean>;
} {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [isCreatingManualDraft, setIsCreatingManualDraft] = useState(false);
  const [isNameDialogOpen, setNameDialogOpen] = useState(false);

  const openManualDraftNameDialog = useCallback(() => {
    setNameDialogOpen(true);
  }, []);

  const createManualServerDraftAndGoToBuilder = useCallback(
    async (trimmedName: string) => {
      const name = trimmedName.trim();
      if (name.length === 0) {
        return false;
      }

      setIsCreatingManualDraft(true);
      try {
        const result = await createDraftQuizAction(locale, name);
        if (result.success) {
          setNameDialogOpen(false);
          router.push(`/builder/${result.quizId}`);
          return true;
        }
        showToast(result.error || t(locale, "common.error"), "error");
        return false;
      } catch {
        showToast(t(locale, "common.error"), "error");
        return false;
      } finally {
        setIsCreatingManualDraft(false);
      }
    },
    [locale, router, showToast],
  );

  return {
    isCreatingManualDraft,
    isNameDialogOpen,
    setNameDialogOpen,
    openManualDraftNameDialog,
    createManualServerDraftAndGoToBuilder,
  };
}
