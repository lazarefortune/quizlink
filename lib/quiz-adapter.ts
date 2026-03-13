import type { QuizBuilder } from "@/types/quiz-builder";
import type { Quiz, Question as PlayerQuestion } from "@/types/quiz";

export function adaptQuizBuilderToPlayer(quizBuilder: QuizBuilder): Quiz {
  const adaptedQuestions: PlayerQuestion[] = quizBuilder.questions.map((q) => {
    // Randomize options if enabled
    let options = q.options;
    if (quizBuilder.settings.randomizeQuestions) {
      options = [...q.options].sort(() => Math.random() - 0.5);
    }

    const choices = options.map((opt) => opt.label);

    if (q.type === "TRUE_FALSE") {
      const correctIndex = options.findIndex((opt) => opt.isCorrect);
      return {
        id: q.id,
        quizId: quizBuilder.id,
        type: "TRUE_FALSE",
        question: q.label,
        choices,
        correctAnswer: correctIndex >= 0 ? correctIndex : 0,
        image: q.image,
      };
    } else if (q.type === "CHECKBOX") {
      const correctIndices = options
        .map((opt, index) => (opt.isCorrect ? index : -1))
        .filter((index) => index >= 0);
      return {
        id: q.id,
        quizId: quizBuilder.id,
        type: "CHECKBOX",
        question: q.label,
        choices,
        correctAnswer: correctIndices.length > 0 ? correctIndices : [0],
        image: q.image,
      };
    } else {
      const correctIndex = options.findIndex((opt) => opt.isCorrect);
      return {
        id: q.id,
        quizId: quizBuilder.id,
        type: "MCQ",
        question: q.label,
        choices,
        correctAnswer: correctIndex >= 0 ? correctIndex : 0,
        image: q.image,
      };
    }
  });

  const randomizedQuestions = quizBuilder.settings.randomizeQuestions
    ? [...adaptedQuestions].sort(() => Math.random() - 0.5)
    : adaptedQuestions;

  return {
    id: quizBuilder.id,
    title: quizBuilder.name,
    sourceType: "TEXT",
    expiresAt: null,
    ownerId: null,
    createdAt: new Date(quizBuilder.createdAt),
    questions: randomizedQuestions,
    settings: quizBuilder.settings,
  };
}
