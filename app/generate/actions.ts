"use server";

import { getAiLimits, validateTextLength, validateQuestionCount } from "@/lib/ai/ai-limits";
import { generateQuizWithAI } from "@/lib/ai/quiz-generator";
import { hasEnoughCoins, deductCoins } from "@/lib/coins";
import { auth } from "@/lib/auth";
import type { Question } from "@/types/quiz-builder";

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
    const isAdmin = session.user.role === "ADMIN";

    // Step 2: Server-side coin balance check (before any generation)
    // ADMIN users bypass this check
    if (!isAdmin) {
      const hasCoins = await hasEnoughCoins(userId, COINS_PER_GENERATION);
      if (!hasCoins) {
        return {
          success: false,
          error: "errors.insufficientCoins",
        };
      }
    }

    // Step 3: Validate input (content length, question count)
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

    // Step 4: Generate quiz with AI (external API call)
    let aiResult: { title: string; questions: Question[] };
    try {
      aiResult = await generateQuizWithAI(content, options);
    } catch (error) {
      // AI generation failed - do NOT deduct coins
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "errors.generationFailed",
      };
    }

    // Step 5: Deduct coins ONLY after successful generation
    // This is atomic: coin deduction and transaction creation happen in a single DB transaction
    console.log(`[DEBUG] Attempting to deduct ${COINS_PER_GENERATION} coins from user ${userId}`);
    const deductResult = await deductCoins(
      userId,
      COINS_PER_GENERATION,
      `AI quiz generation: ${aiResult.title}`
    );

    console.log(`[DEBUG] Coin deduction result:`, {
      success: deductResult.success,
      error: deductResult.error,
      newBalance: deductResult.newBalance,
    });

    // Step 6: If coin deduction fails, return error (even though generation succeeded)
    // This prevents free quizzes if there's a database issue
    if (!deductResult.success) {
      console.error(
        `[CRITICAL] Coin deduction failed after successful AI generation for user ${userId}:`,
        deductResult.error
      );
      return {
        success: false,
        error: "errors.coinDeductionFailed",
      };
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
