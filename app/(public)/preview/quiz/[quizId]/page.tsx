import { redirect } from "next/navigation";

import { QuizPreviewPlayer } from "@/components/quiz-preview/quiz-preview-player";
import { getQuizPreviewData } from "@/lib/quiz/get-quiz-preview-data";
import { buildQuizPreviewPath } from "@/lib/quiz/quiz-preview-routes";

type PageProps = {
  params: Promise<{ quizId: string }>;
};

export default async function QuizPreviewPage({ params }: PageProps) {
  const { quizId } = await params;
  const result = await getQuizPreviewData(quizId);

  if (!result.success) {
    if (result.error === "Unauthorized") {
      redirect(
        `/auth/signin?callbackUrl=${encodeURIComponent(buildQuizPreviewPath(quizId))}`,
      );
    }
    redirect("/dashboard/quizzes");
  }

  const { data } = result;

  return (
    <QuizPreviewPlayer
      quizId={data.quizId}
      quizName={data.quizName}
      quizStatus={data.quizStatus}
      settings={data.settings}
      questions={data.questions}
    />
  );
}
