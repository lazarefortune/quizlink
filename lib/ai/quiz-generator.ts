import { getOpenAIClient } from "./openai-client";
import { buildQuizGenerationPrompt } from "./prompt-builder";
import type { Question, QuestionType } from "@/types/quiz-builder";

type AiQuizResponse = {
  title: string;
  questions: Array<{
    type: "MULTIPLE_CHOICE" | "TRUE_FALSE";
    label: string;
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

function adaptAiQuestionsToQuizBuilder(
  aiQuestions: AiQuizResponse["questions"]
): Question[] {
  return aiQuestions.map((q, index) => {
    const questionId = `q-ai-${Date.now()}-${index}`;

    return {
      id: questionId,
      type: q.type as QuestionType,
      label: q.label,
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

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            options.language === "fr"
              ? "Tu es un assistant de génération de quiz. Retourne toujours uniquement du JSON valide, sans explications."
              : "You are a quiz generation assistant. Always return valid JSON only, no explanations.",
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
              content:
                options.language === "fr"
                  ? "Tu es un assistant de génération de quiz. Retourne toujours uniquement du JSON valide, sans explications."
                  : "You are a quiz generation assistant. Always return valid JSON only, no explanations.",
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
            const additionalQuestions = adaptAiQuestionsToQuizBuilder(followUpParsed.questions);
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
