import { t, type Locale } from "@/lib/i18n";

import type { QuizResponseQuotaStatus } from "./quizResponseQuotaStatus";

export type QuizDetailHeaderQuotaTone =
  | "destructive"
  | "muted"
  | "success"
  | "pro";

export type QuizDetailHeaderQuotaLine = {
  label: string;
  tone: QuizDetailHeaderQuotaTone;
  showUnlockAction: boolean;
  unlockActionVariant: "primary" | "secondary";
};

export function formatQuizDetailHeaderQuotaLine(
  quota: QuizResponseQuotaStatus,
  locale: Locale,
): QuizDetailHeaderQuotaLine | null {
  switch (quota.label) {
    case "PRO_ACTIVE":
      return {
        label: t(locale, "dashboard.quizQuota.proUnlocked"),
        tone: "pro",
        showUnlockAction: false,
        unlockActionVariant: "secondary",
      };
    case "UNLOCKED":
      return {
        label: t(locale, "dashboard.quizQuota.unlocked"),
        tone: "success",
        showUnlockAction: false,
        unlockActionVariant: "secondary",
      };
    case "FREE_LIMIT_REACHED":
      return {
        label: t(locale, "dashboard.quizQuota.freeResponsesUsed", {
          count: quota.completedResponses,
          limit: quota.freeLimit,
        }),
        tone: "destructive",
        showUnlockAction: true,
        unlockActionVariant: "primary",
      };
    case "FREE_AVAILABLE":
      return {
        label: t(locale, "dashboard.quizQuota.freeResponsesUsed", {
          count: quota.completedResponses,
          limit: quota.freeLimit,
        }),
        tone: "muted",
        showUnlockAction: true,
        unlockActionVariant: "secondary",
      };
    default:
      return null;
  }
}
