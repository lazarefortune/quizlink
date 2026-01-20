import type { Quiz, Question } from "@/types/quiz";

function generateMockQuestions(
  quizId: string,
  count: number,
  sourceType: "TEXT" | "PDF"
): Question[] {
  const questions: Question[] = [];

  for (let i = 0; i < count; i++) {
    const questionIndex = i + 1;

    if (i % 3 === 0) {
      questions.push({
        id: `q-${quizId}-${questionIndex}`,
        quizId,
        type: "TRUE_FALSE",
        question: `Question ${questionIndex}: This is a true/false question about the ${sourceType} content. Is this statement correct?`,
        choices: ["True", "False"],
        correctAnswer: questionIndex % 2 === 0 ? 0 : 1,
      });
    } else {
      questions.push({
        id: `q-${quizId}-${questionIndex}`,
        quizId,
        type: "MCQ",
        question: `Question ${questionIndex}: What is the main topic discussed in the ${sourceType} content?`,
        choices: [
          "Option A: First choice",
          "Option B: Second choice",
          "Option C: Third choice",
          "Option D: Fourth choice",
        ],
        correctAnswer: questionIndex % 4,
      });
    }
  }

  return questions;
}

export function generateMockQuiz(
  sourceType: "TEXT" | "PDF",
  questionCount: number,
  sourceContent?: string
): Quiz {
  const quizId = `quiz-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const title = sourceType === "TEXT"
    ? "Quiz from Text"
    : "Quiz from PDF";

  return {
    id: quizId,
    title,
    sourceType,
    expiresAt: null,
    ownerId: null,
    createdAt: new Date(),
    questions: generateMockQuestions(quizId, questionCount, sourceType),
  };
}
