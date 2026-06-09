import { prisma } from "@/lib/prisma";

import { getQuizLinkCampaignDates } from "./quizLinkCampaign";

/**
 * Starts the 7-day campaign on first real attempt (idempotent).
 * Does not update lastResponseAt — use touchQuizLinkLastResponseAt on finish/abandon.
 */
export async function ensureQuizLinkCampaignStarted(
  quizLinkId: string,
  now: Date = new Date(),
): Promise<void> {
  if (!prisma) return;

  const dates = getQuizLinkCampaignDates(now);
  await prisma.quizLink.updateMany({
    where: { id: quizLinkId, responsesStartedAt: null },
    data: {
      responsesStartedAt: dates.responsesStartedAt,
      acceptingResponsesUntil: dates.acceptingResponsesUntil,
      detailsVisibleUntil: dates.detailsVisibleUntil,
    },
  });
}

export async function touchQuizLinkLastResponseAt(
  quizLinkId: string,
  now: Date = new Date(),
): Promise<void> {
  if (!prisma) return;

  await prisma.quizLink.update({
    where: { id: quizLinkId },
    data: { lastResponseAt: now },
  });
}
