import Link from "next/link";
import { getParticipantPortal } from "@/lib/participant-portal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileQuestion, Trophy, Calendar, Play } from "lucide-react";

type PageProps = {
  params: Promise<{ participantToken: string }>;
};

function formatScore(score: number) {
  return `${Math.round(score)} %`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function ParticipantPortalPage({ params }: PageProps) {
  const { participantToken } = await params;
  const result = await getParticipantPortal(participantToken);

  if (!result.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Portail indisponible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {result.error === "Lien invalide"
                ? "Ce lien n'existe pas ou a été révoqué."
                : result.error}
            </p>
            <p className="text-sm text-muted-foreground">
              Si tu penses qu'il s'agit d'une erreur, demande un nouveau lien à la personne qui t'a invité.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { participant, quizzes } = result;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="container max-w-2xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Salut {participant.name} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Voici tes quiz et ta progression.
          </p>
        </div>

        {quizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileQuestion className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">Aucun quiz pour le moment</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Quand quelqu'un t'enverra un lien vers un quiz, il apparaîtra ici.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-4">
            {quizzes.map((q) => (
              <li key={q.quizId}>
                <Card className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="text-lg">{q.quizName}</CardTitle>
                      <Button asChild size="sm" className="shrink-0">
                        <Link href={`/quiz/${q.linkToken}`}>
                          <Play className="h-4 w-4 mr-1.5" />
                          Jouer
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Trophy className="h-4 w-4 text-primary" />
                        {q.attemptsCount === 0
                          ? "Pas encore de tentative"
                          : `Meilleur score : ${q.bestScore != null ? formatScore(q.bestScore) : "—"}`}
                      </span>
                      {q.attemptsCount > 0 && (
                        <span className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="font-normal">
                            {q.attemptsCount} tentative{q.attemptsCount > 1 ? "s" : ""}
                          </Badge>
                        </span>
                      )}
                      {q.lastAttemptAt && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          Dernière fois : {formatDate(q.lastAttemptAt)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
