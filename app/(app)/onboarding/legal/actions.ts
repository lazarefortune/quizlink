"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CURRENT_PRIVACY_VERSION, CURRENT_TERMS_VERSION } from "@/lib/legal-versions";
import { t } from "@/lib/i18n";
import { sendWelcomeEmailIfNeeded } from "@/lib/sendWelcomeEmailIfNeeded";

export type AcceptLegalDocumentsResult =
  | { success: true }
  | { success: false; error: string };

export async function acceptLegalDocumentsAction(
  legalAccepted: boolean,
  locale: "fr" | "en" = "fr"
): Promise<AcceptLegalDocumentsResult> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  if (legalAccepted !== true) {
    return {
      success: false,
      error: t(locale, "onboarding.legal.requiredError"),
    };
  }

  if (!prisma) {
    return {
      success: false,
      error:
        locale === "fr"
          ? "Base de données indisponible. Réessaie plus tard."
          : "Database unavailable. Please try again later.",
    };
  }

  const now = new Date();
  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        termsAcceptedAt: now,
        termsVersion: CURRENT_TERMS_VERSION,
        privacyAcceptedAt: now,
        privacyVersion: CURRENT_PRIVACY_VERSION,
      },
    });
  } catch {
    return {
      success: false,
      error:
        locale === "fr"
          ? "Impossible d'enregistrer ton acceptation. Réessaie."
          : "Could not save your acceptance. Please try again.",
    };
  }

  await sendWelcomeEmailIfNeeded(session.user.id);

  return { success: true };
}
