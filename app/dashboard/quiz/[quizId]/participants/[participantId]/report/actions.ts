"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildQuizParticipantReportPayload } from "@/lib/analytics/quiz-participant-aggregator";
import { generateParticipantReportFromPayload } from "@/lib/ai/participant-report-generator";
import { deductCoins } from "@/lib/coins";
import { sendEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

const COINS_PER_REPORT = 4;
const REPORT_REASON = "Rapport IA participant (quiz)";

type GenerateReportResponse =
  | { success: true; report: import("@/lib/ai/participant-report-schema").ParticipantReportOutput }
  | { success: false; error: string };

/**
 * Generate AI participant report for a quiz/participant.
 * 1) Verify auth, quiz ownership, participant has attempts
 * 2) Check coins >= 4 (ADMIN can bypass)
 * 3) Build aggregated payload, call OpenAI, validate with Zod
 * 4) Deduct 4 coins only on success
 */
export async function generateQuizParticipantReportAction(
  quizId: string,
  participantId: string
): Promise<GenerateReportResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "errors.unauthorized" };
    }

    if (!prisma) {
      return { success: false, error: "errors.databaseNotInitialized" };
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { ownerId: true },
    });
    if (!quiz) {
      return { success: false, error: "Quiz introuvable" };
    }
    if (quiz.ownerId !== session.user.id) {
      return { success: false, error: "errors.unauthorized" };
    }

    const link = await prisma.quizLink.findFirst({
      where: { quizId, participantId },
      include: {
        _count: { select: { attempts: true } },
      },
    });
    if (!link || link._count.attempts === 0) {
      return { success: false, error: "Ce participant n'a aucune tentative pour ce quiz." };
    }

    const isAdmin = session.user.role === "ADMIN";
    const balance = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coinBalance: true },
    }).then((u) => u?.coinBalance ?? 0);

    if (!isAdmin && balance < COINS_PER_REPORT) {
      return {
        success: false,
        error: "errors.insufficientCoins",
      };
    }

    const payload = await buildQuizParticipantReportPayload(quizId, participantId);
    if (!payload) {
      return { success: false, error: "Impossible de préparer les données du rapport." };
    }

    const report = await generateParticipantReportFromPayload(payload);

    const deductResult = await deductCoins(
      session.user.id,
      COINS_PER_REPORT,
      REPORT_REASON,
      isAdmin ? { allowNegativeBalance: true } : undefined
    );
    if (!deductResult.success) {
      return {
        success: false,
        error: deductResult.error === "Insufficient coins" ? "errors.insufficientCoins" : "errors.coinDeductionFailed",
      };
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/quiz/${quizId}/participants/${participantId}/report`);
    revalidatePath("/account/coins");

    return { success: true, report };
  } catch (error) {
    console.error("[generateQuizParticipantReportAction]", error);
    return {
      success: false,
      error: "Erreur lors de la génération du rapport. Veuillez réessayer.",
    };
  }
}

type SendReportEmailResponse = { success: true } | { success: false; error: string };

/**
 * Send the participant AI report by email as PDF attachment.
 * Verifies auth and quiz ownership. Recipient email is required and validated.
 */
export async function sendReportByEmailAction(
  quizId: string,
  participantId: string,
  recipientEmail: string,
  pdfBase64: string,
  locale: "fr" | "en"
): Promise<SendReportEmailResponse> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "errors.unauthorized" };
    }
    if (!prisma) {
      return { success: false, error: "errors.databaseNotInitialized" };
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      select: { id: true, name: true, ownerId: true },
    });
    if (!quiz || quiz.ownerId !== session.user.id) {
      return { success: false, error: "errors.unauthorized" };
    }

    const participant = await prisma.participant.findUnique({
      where: { id: participantId },
      select: { name: true },
    });
    if (!participant) {
      return { success: false, error: "Participant introuvable." };
    }

    const emailTrimmed = recipientEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      return { success: false, error: "Invalid email address" };
    }

    if (!pdfBase64 || typeof pdfBase64 !== "string") {
      return { success: false, error: "PDF manquant." };
    }

    const pdfBuffer = Buffer.from(pdfBase64, "base64");
    const filename =
      locale === "fr"
        ? `Rapport-${participant.name.replace(/[^a-zA-Z0-9-_]/g, "-")}-${quiz.name.replace(/[^a-zA-Z0-9-_]/g, "-")}.pdf`
        : `Report-${participant.name.replace(/[^a-zA-Z0-9-_]/g, "-")}-${quiz.name.replace(/[^a-zA-Z0-9-_]/g, "-")}.pdf`;

    const subject =
      locale === "fr"
        ? `Rapport de votre quiz - ${quiz.name} - ${participant.name}`
        : `Report of your quiz - ${quiz.name} - ${participant.name}`;
    const html =
      locale === "fr"
        ? `<p>Bonjour,</p><p>Veuillez trouver en pièce jointe le rapport d'analyse de <strong>${participant.name}</strong> sur le quiz <strong>${quiz.name}</strong>.</p><p>Cordialement,<br/>QuizLink</p>`
        : `<p>Hello,</p><p>Please find attached the analysis report of <strong>${participant.name}</strong> on the quiz <strong>${quiz.name}</strong>.</p><p>Best regards,<br/>QuizLink</p>`;

    const result = await sendEmail({
      to: emailTrimmed,
      subject,
      html,
      attachments: [
        {
          filename,
          content: pdfBuffer,
        },
      ],
    });

    if (!result.success) {
      return { success: false, error: result.error ?? "Failed to send email" };
    }
    return { success: true };
  } catch (error) {
    console.error("[sendReportByEmailAction]", error);
    return {
      success: false,
      error: "Erreur lors de l'envoi de l'email. Veuillez réessayer.",
    };
  }
}
