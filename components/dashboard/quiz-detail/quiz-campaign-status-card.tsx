"use client";

import type { QuizLinkCampaignUiSnapshot } from "@/lib/quiz/quizLinkCampaign";
import { FREE_DETAILED_ATTEMPTS_LIMIT } from "@/lib/quiz/quizLinkCampaign";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

type QuizCampaignStatusCardProps = {
  campaign: QuizLinkCampaignUiSnapshot;
};

function formatCampaignDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function QuizCampaignStatusCard({
  campaign,
}: QuizCampaignStatusCardProps) {
  const { locale } = useLocale();

  if (campaign.responsesStartedAt == null) {
    return null;
  }

  const acceptingDate =
    campaign.acceptingResponsesUntil != null
      ? formatCampaignDate(campaign.acceptingResponsesUntil, locale)
      : null;

  let message: string | null = null;

  if (campaign.isAcceptingResponses && acceptingDate && !campaign.isUnlocked) {
    message = t(locale, "dashboard.campaign.freeActiveSummary", {
      date: acceptingDate,
      limit: String(campaign.detailedPreviewLimit ?? FREE_DETAILED_ATTEMPTS_LIMIT),
    });
  } else if (!campaign.isFreePeriodActive && !campaign.isUnlocked) {
    message = t(locale, "dashboard.campaign.freePeriodEnded");
  }

  if (!message) {
    return null;
  }

  return (
    <p className="text-sm text-muted-foreground">{message}</p>
  );
}
