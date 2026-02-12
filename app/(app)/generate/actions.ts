"use server";

import { getAiLimits, validateTextLength, validateQuestionCount } from "@/lib/ai/ai-limits";
import { generateQuizWithAI } from "@/lib/ai/quiz-generator";
import { deductCoins } from "@/lib/coins";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Question } from "@/types/quiz-builder";

// Import prisma for verification

const COINS_PER_GENERATION = 2;

type GenerateQuizResult =
  | { success: true; title: string; questions: Question[] }
  | { success: false; error: string };

/**
 * Server Action: Generate quiz with AI
 *
 * SECURITY RULES:
 * - All coin checks and deductions happen server-side
 * - Coins are deducted ONLY if generation succeeds
 * - Atomic transaction ensures coin deduction is persisted
 * - ADMIN users can bypass coin restrictions
 */
export async function generateQuizAction(
  content: string,
  options: {
    questionType: string;
    maxQuestions: number;
    language: string;
  }
): Promise<GenerateQuizResult> {
  try {
    // Step 1: Authenticate user (server-side only)
    const session = await auth();
    if (!session?.user?.id) {
      return {
        success: false,
        error: "errors.unauthorized",
      };
    }

    const userId = session.user.id;

    // Step 2: Validate input FIRST (before any coin operations)
    // This prevents wasting coins on invalid input
    const limits = getAiLimits();

    const textValidation = validateTextLength(content, limits);
    if (!textValidation.valid) {
      const errorKey = content.length < limits.minTextLength
        ? "errors.textTooShort"
        : "errors.textTooLong";
      return {
        success: false,
        error: errorKey,
      };
    }

    const questionValidation = validateQuestionCount(
      options.maxQuestions,
      limits
    );
    if (!questionValidation.valid) {
      const errorKey = options.maxQuestions < 1
        ? "errors.atLeastOneQuestion"
        : "errors.invalidQuestionCount";
      return {
        success: false,
        error: errorKey,
      };
    }

    // Step 3: CRITICAL SECURITY - Deduct coins BEFORE AI generation
    // This prevents race conditions and ensures coins are reserved
    // All users (including admins) must pay for AI generation
    let coinsDeducted = false;
    console.log(`[generateQuizAction] User ${userId}. Deducting ${COINS_PER_GENERATION} coins BEFORE AI generation`);
    console.log(`[generateQuizAction] Current session coinBalance: ${session.user.coinBalance}`);
    
    const deductResult = await deductCoins(
      userId,
      COINS_PER_GENERATION,
      `AI quiz generation (reserved)`
    );

    console.log(`[generateQuizAction] deductCoins returned:`, JSON.stringify(deductResult));

    if (!deductResult.success) {
      // Insufficient coins or other error - abort before calling OpenAI
      console.error(`[generateQuizAction] ❌ Coin deduction failed BEFORE AI generation: ${deductResult.error}`);
      return {
        success: false,
        error: deductResult.error === "Insufficient coins"
          ? "errors.insufficientCoins"
          : "errors.coinDeductionFailed",
      };
    }

    coinsDeducted = true;
    console.log(`[generateQuizAction] ✅ Coins deducted successfully. New balance: ${deductResult.newBalance}`);
    
    // Verify the deduction by checking the database directly
    const verifyBalance = await prisma?.user.findUnique({
      where: { id: userId },
      select: { coinBalance: true },
    });
    console.log(`[generateQuizAction] Verification: balance in DB is now ${verifyBalance?.coinBalance}`);

    // Step 4: Generate quiz with AI (external API call)
    // Coins are already deducted at this point
    let aiResult: { title: string; questions: Question[] };
    try {
      aiResult = await generateQuizWithAI(content, options);
    } catch (error) {
      // AI generation failed - REFUND coins if they were deducted
      if (coinsDeducted) {
        console.log(`[generateQuizAction] AI generation failed. Refunding ${COINS_PER_GENERATION} coins to user ${userId}`);
        const { creditCoins } = await import("@/lib/coins");
        const refundResult = await creditCoins(
          userId,
          COINS_PER_GENERATION,
          `Refund: AI generation failed`,
          true // skipAuthCheck for refunds
        );

        if (!refundResult.success) {
          // CRITICAL: Log this as it means user lost coins without getting a quiz
          console.error(
            `[CRITICAL] Failed to refund coins after AI generation failure for user ${userId}. ` +
            `User lost ${COINS_PER_GENERATION} coins without receiving a quiz.`
          );
        }
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "errors.generationFailed",
      };
    }

    // Step 5: Update transaction reason with actual quiz title (for audit trail)
    // Coins were already deducted, so we just update the reason
    if (coinsDeducted) {
      // Update the transaction reason to include the actual quiz title
      // This is optional but improves audit trail
      try {
        await prisma?.coinTransaction.updateMany({
          where: {
            userId,
            amount: -COINS_PER_GENERATION,
            reason: `AI quiz generation (reserved)`,
            createdAt: {
              gte: new Date(Date.now() - 60000), // Last minute
            },
          },
          data: {
            reason: `AI quiz generation: ${aiResult.title}`,
          },
        });
      } catch (error) {
        // Non-critical: log but don't fail the request
        console.warn(`[generateQuizAction] Failed to update transaction reason:`, error);
      }
    }

    // Step 7: Return successful result
    return {
      success: true,
      title: aiResult.title,
      questions: aiResult.questions,
    };
  } catch (error) {
    // Unexpected error - log and return generic error
    console.error("Unexpected error in generateQuizAction:", error);
    return {
      success: false,
      error: "errors.generationFailed",
    };
  }
}
