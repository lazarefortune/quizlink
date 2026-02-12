import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getLinkDetails } from "../../actions";
import { QuizAttemptsContent } from "./quiz-attempts-content";

type PageProps = {
  params: Promise<{ participantId: string; linkId: string }>;
};

export default async function QuizAttemptsPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { participantId, linkId } = await params;
  const result = await getLinkDetails(participantId, linkId);

  if (!result.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Erreur</h1>
          <p className="text-muted-foreground">{result.error}</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          Chargement...
        </div>
      }
    >
      <QuizAttemptsContent
        participant={result.data.participant}
        link={result.data.link}
      />
    </Suspense>
  );
}
