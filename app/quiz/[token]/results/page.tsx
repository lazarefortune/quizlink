import { Suspense } from "react";
import { AnonymousQuizResultsContent } from "./anonymous-quiz-results-content";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function AnonymousQuizResultsPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>}>
      <AnonymousQuizResultsContent token={token} />
    </Suspense>
  );
}
