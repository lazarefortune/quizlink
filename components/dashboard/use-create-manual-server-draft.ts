"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { createDraftQuizAction } from "@/app/(app)/dashboard/create/actions";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

export function useCreateManualServerDraft(): {
  isCreatingManualDraft: boolean;
  createManualServerDraftAndGoToBuilder: (nameInput?: string) => Promise<boolean>;
} {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [isCreatingManualDraft, setIsCreatingManualDraft] = useState(false);

  const createManualServerDraftAndGoToBuilder = useCallback(
    async (nameInput?: string) => {
      const trimmedInput = typeof nameInput === "string" ? nameInput.trim() : "";
      const name =
        trimmedInput.length > 0 ? trimmedInput : t(locale, "builder.defaultDraftName");

      setIsCreatingManualDraft(true);
      try {
        const result = await createDraftQuizAction(locale, name);
        if (result.success) {
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
    createManualServerDraftAndGoToBuilder,
  };
}
