import { getOpenAIClient } from "./openai-client";
import { buildQuizGenerationPrompt } from "./prompt-builder";
import type { Question, QuestionType } from "@/types/quiz-builder";

type AiQuizResponse = {
  title: string;
  questions: Array<{
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
    label: string;
    explanation?: string;
    options: Array<{
      label: string;
      isCorrect: boolean;
    }>;
  }>;
};

function validateAiResponse(response: unknown): response is AiQuizResponse {
  if (!response || typeof response !== "object") {
    return false;
  }

  const data = response as Record<string, unknown>;

  if (typeof data.title !== "string" || data.title.trim().length === 0) {
    return false;
  }

  if (!Array.isArray(data.questions)) {
    return false;
  }

  for (const question of data.questions) {
    if (
      typeof question !== "object" ||
      !question ||
      typeof (question as Record<string, unknown>).type !== "string" ||
      typeof (question as Record<string, unknown>).label !== "string" ||
      !Array.isArray((question as Record<string, unknown>).options)
    ) {
      return false;
    }

    const q = question as {
      type: string;
      label: string;
      options: unknown[];
    };

    if (q.type !== "MULTIPLE_CHOICE" && q.type !== "TRUE_FALSE") {
      return false;
    }

    if (q.type === "TRUE_FALSE" && q.options.length !== 2) {
      return false;
    }

    if (q.type === "MULTIPLE_CHOICE" && q.options.length !== 4) {
      return false;
    }

    const correctCount = q.options.filter(
      (opt: unknown) =>
        typeof opt === "object" &&
        opt !== null &&
        (opt as Record<string, unknown>).isCorrect === true
    ).length;

    if (correctCount !== 1) {
      return false;
    }
  }

  return true;
}

/** Extract explanation from AI question; AI may use explanation, explication, hint, feedback */
function getExplanationFromAiQuestion(q: Record<string, unknown>): string | undefined {
  const keys = ["explanation", "explication", "hint", "feedback"];
  for (const key of keys) {
    const val = q[key];
    if (typeof val === "string" && val.trim()) return val.trim();
  }
  return undefined;
}

function adaptAiQuestionsToQuizBuilder(
  aiQuestions: AiQuizResponse["questions"]
): Question[] {
  return aiQuestions.map((q, index) => {
    const questionId = `q-ai-${Date.now()}-${index}`;
    const qRecord = q as Record<string, unknown>;
    const explanation = getExplanationFromAiQuestion(qRecord);

    return {
      id: questionId,
      type: q.type as QuestionType,
      label: q.label,
      explanation,
      options: q.options.map((opt, optIndex) => ({
        id: `opt-${questionId}-${optIndex}`,
        label: opt.label,
        isCorrect: opt.isCorrect,
      })),
    };
  });
}

export async function generateQuizWithAI(
  content: string,
  options: {
    questionType: string;
    maxQuestions: number;
    language: string;
  }
): Promise<{ title: string; questions: Question[] }> {
  const client = getOpenAIClient();
  const prompt = buildQuizGenerationPrompt({
    content,
    ...options,
  });

  try {
    // Calculate max_tokens based on number of questions
    // Each question needs ~200-300 tokens (question text + 4 options)
    // Add buffer for title and JSON structure
    // gpt-4o-mini supports up to 16384 tokens
    const estimatedTokensPerQuestion = 350; // Increased estimate
    const calculatedTokens = options.maxQuestions * estimatedTokensPerQuestion + 1000; // Larger buffer
    const maxTokens = Math.min(16384, Math.max(4000, calculatedTokens)); // Cap at model limit

    const systemMessage =
      options.language === "fr"
        ? options.questionType === "MCQ"
          ? "Tu es un assistant de génération de quiz. Retourne toujours uniquement du JSON valide. Chaque question DOIT avoir \"type\": \"MULTIPLE_CHOICE\" avec 4 options. Ne génère AUCUNE question vrai/faux (TRUE_FALSE). Chaque question doit contenir le champ \"explanation\"."
          : options.questionType === "TRUE_FALSE"
            ? "Tu es un assistant de génération de quiz. Retourne toujours uniquement du JSON valide. Chaque question DOIT avoir \"type\": \"TRUE_FALSE\" avec 2 options. Ne génère AUCUNE question à choix multiples (MULTIPLE_CHOICE). Chaque question doit contenir le champ \"explanation\"."
            : "Tu es un assistant de génération de quiz. Retourne toujours uniquement du JSON valide, sans texte autour. Chaque question dans le JSON doit contenir le champ \"explanation\" (1-2 phrases expliquant la bonne réponse)."
        : options.questionType === "MCQ"
          ? "You are a quiz generation assistant. Always return valid JSON only. Every question MUST have \"type\": \"MULTIPLE_CHOICE\" with 4 options. Do NOT generate any true/false (TRUE_FALSE) question. Each question must include the \"explanation\" field."
          : options.questionType === "TRUE_FALSE"
            ? "You are a quiz generation assistant. Always return valid JSON only. Every question MUST have \"type\": \"TRUE_FALSE\" with 2 options. Do NOT generate any multiple choice (MULTIPLE_CHOICE) question. Each question must include the \"explanation\" field."
            : "You are a quiz generation assistant. Always return valid JSON only, no text outside. Each question in the JSON must include the \"explanation\" field (1-2 sentences explaining the correct answer).";

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: maxTokens,
    });

    const responseText = completion.choices[0]?.message?.content;

    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    let parsedResponse: unknown;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch {
      throw new Error("Invalid JSON response from OpenAI");
    }

    if (!validateAiResponse(parsedResponse)) {
      throw new Error("Invalid quiz structure from OpenAI");
    }

    let generatedQuestions = adaptAiQuestionsToQuizBuilder(parsedResponse.questions);

    // Enforce requested question type: filter out any question that does not match
    const requestedType = options.questionType;
    if (requestedType === "MCQ" || requestedType === "TRUE_FALSE") {
      const allowedType = requestedType === "MCQ" ? "MULTIPLE_CHOICE" : "TRUE_FALSE";
      const beforeCount = generatedQuestions.length;
      generatedQuestions = generatedQuestions.filter((q) => q.type === allowedType);
      if (generatedQuestions.length < beforeCount) {
        console.warn(
          `Filtered out ${beforeCount - generatedQuestions.length} questions that did not match requested type ${requestedType}.`
        );
      }
    }

    const title = parsedResponse.title.trim();

    // If we didn't get enough questions, try to generate the missing ones
    if (generatedQuestions.length < options.maxQuestions) {
      const missingCount = options.maxQuestions - generatedQuestions.length;
      console.log(
        `AI generated ${generatedQuestions.length} questions but ${options.maxQuestions} were requested. ` +
        `Attempting to generate ${missingCount} additional questions.`
      );

      try {
        // Generate additional questions with a follow-up prompt
        const followUpPrompt = options.language === "fr"
          ? `Génère exactement ${missingCount} questions supplémentaires pour compléter ce quiz. Utilise le même contenu que précédemment et génère des questions différentes de celles déjà créées. Retourne UNIQUEMENT du JSON valide avec un tableau "questions" contenant exactement ${missingCount} questions.`
          : `Generate exactly ${missingCount} additional questions to complete this quiz. Use the same content as before and generate questions different from those already created. Return ONLY valid JSON with a "questions" array containing exactly ${missingCount} questions.`;

        const followUpCompletion = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: systemMessage,
            },
            {
              role: "user",
              content: `${buildQuizGenerationPrompt({ ...options, content, maxQuestions: missingCount })}\n\n${followUpPrompt}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: Math.min(16384, missingCount * 350 + 500),
        });

        const followUpText = followUpCompletion.choices[0]?.message?.content;
        if (followUpText) {
          const followUpParsed = JSON.parse(followUpText);
          if (validateAiResponse(followUpParsed)) {
            let additionalQuestions = adaptAiQuestionsToQuizBuilder(followUpParsed.questions);
            if (requestedType === "MCQ" || requestedType === "TRUE_FALSE") {
              const allowedType = requestedType === "MCQ" ? "MULTIPLE_CHOICE" : "TRUE_FALSE";
              additionalQuestions = additionalQuestions.filter((q) => q.type === allowedType);
            }
            generatedQuestions = [...generatedQuestions, ...additionalQuestions];
            console.log(`Successfully generated ${additionalQuestions.length} additional questions. Total: ${generatedQuestions.length}`);
          }
        }
      } catch (error) {
        console.warn("Failed to generate additional questions:", error);
        // Continue with what we have
      }
    }

    // Final check: if we still don't have enough, log a warning
    if (generatedQuestions.length < options.maxQuestions) {
      console.warn(
        `Final count: ${generatedQuestions.length} questions generated (requested: ${options.maxQuestions}). ` +
        `User can add the remaining ${options.maxQuestions - generatedQuestions.length} questions manually.`
      );
    }

    return {
      title,
      questions: generatedQuestions,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`AI generation failed: ${error.message}`);
    }
    throw new Error("AI generation failed: Unknown error");
  }
}
