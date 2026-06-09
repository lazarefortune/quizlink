import { Suspense } from "react";

import { getQuizLinkByToken } from "@/app/quiz-link/actions";
import { auth } from "@/lib/auth";
import { getRequestLocale } from "@/lib/i18n/request-locale";
import { resolveQuizActionError } from "@/lib/quiz/resolveQuizActionError";

import { QuizIntroductionContent } from "./quiz-introduction-content";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function QuizIntroductionPage({ params }: PageProps) {
  const { token } = await params;
  const requestLocale = await getRequestLocale();

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

  const [result, session] = await Promise.all([
    getQuizLinkByToken(token),
    auth(),
  ]);

  if (!result.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Quiz non trouvé</h1>
          <p className="text-muted-foreground">
            {resolveQuizActionError(requestLocale, result.error)}
          </p>
        </div>
      </div>
    );
  }

  const isOwner =
    session?.user?.id != null &&
    result.quizLink.quiz.ownerId != null &&
    session.user.id === result.quizLink.quiz.ownerId;

  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>}>
      <QuizIntroductionContent
        quizLink={result.quizLink}
        token={token}
        isLinkExpired={!result.quizLink.isAcceptingResponses}
        isOwner={isOwner}
      />
    </Suspense>
  );
}
