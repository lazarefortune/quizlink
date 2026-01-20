import { Suspense } from "react";
import { ParticipantDetailsContent } from "./participant-details-content";
import { getParticipantDetails } from "./actions";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ participantId: string }>;
};

export default async function ParticipantDetailsPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { participantId } = await params;
  const result = await getParticipantDetails(participantId);

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
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Chargement...</div>}>
      <ParticipantDetailsContent participant={result.participant} />
    </Suspense>
  );
}
