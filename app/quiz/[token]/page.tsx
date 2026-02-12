import { Suspense } from "react";
import { QuizIntroductionContent } from "./quiz-introduction-content";
import { getQuizLinkByToken } from "@/app/quiz-link/actions";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function QuizIntroductionPage({ params }: PageProps) {
  const { token } = await params;

  if (!token?.trim()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Lien invalide</h1>
          <p className="text-muted-foreground">L’URL du quiz est incomplète ou incorrecte.</p>
        </div>
      </div>
    );
  }

  const result = await getQuizLinkByToken(token);

  if (!result.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz non trouvé</h1>
          <p className="text-muted-foreground">{result.error}</p>
        </div>
      </div>
    );
  }

  // Even for personalized links, show the introduction page
  // The participant must click "Commencer le quiz" to start

  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>}>
      <QuizIntroductionContent quizLink={result.quizLink} token={token} />
    </Suspense>
  );
}
