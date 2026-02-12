import Link from "next/link";
import { getParticipantPortal } from "@/lib/participant-portal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  FileQuestion,
  Trophy,
  Calendar,
  ArrowRight,
  Target,
  CalendarClock,
} from "lucide-react";

type PageProps = {
  params: Promise<{ participantToken: string }>;
};

function formatScore(score: number) {
  return `${Math.round(score)}%`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function ParticipantPortalPage({ params }: PageProps) {
  const { participantToken } = await params;
  const result = await getParticipantPortal(participantToken);

  if (!result.success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <FileQuestion className="h-7 w-7 text-muted-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold mb-1">
                  Portail indisponible
                </h1>
                <p className="text-sm text-muted-foreground">
                  {result.error === "Lien invalide"
                    ? "Ce lien n'existe pas ou a été révoqué."
                    : result.error}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Si tu penses qu&apos;il s&apos;agit d&apos;une erreur, demande un nouveau
                lien à la personne qui t&apos;a invité.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { participant, quizzes } = result;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar with theme toggle */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="container max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
          <span className="text-sm font-semibold tracking-tight">
            QuizLink
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div className="container max-w-2xl mx-auto px-4 py-6 sm:py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Salut {participant.name} 👋
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Voici tes quiz et ta progression.
          </p>
        </div>

        {quizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                <FileQuestion className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                Aucun quiz pour le moment
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Quand quelqu&apos;un t&apos;enverra un lien vers un quiz, il apparaîtra
                ici.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quizzes.map((q) => {
              const hasAttempts = q.attemptsCount > 0;
              const isExpired =
                q.expiresAt !== null && new Date(q.expiresAt) < new Date();

              return (
                <Card
                  key={q.quizId}
                  className={`transition-shadow hover:shadow-md ${isExpired ? "opacity-70" : ""}`}
                >
                  <CardContent className="p-4 sm:p-5">
                    {/* Desktop: row layout with button on the right */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Left: quiz info */}
                      <div className="flex-1 min-w-0 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-lg font-semibold truncate">
                            {q.quizName}
                          </h2>
                          {isExpired && (
                            <Badge
                              variant="outline"
                              className="border-destructive text-destructive text-xs gap-1"
                            >
                              <CalendarClock className="h-3 w-3" />
                              Expiré
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-muted-foreground">
                          {hasAttempts ? (
                            <div className="flex flex-col gap-2">
                              <div>
                                <span className="flex items-center gap-1.5">
                                  <Trophy className="h-4 w-4 text-warning" />
                                  {q.bestScore != null
                                    ? `Meilleur score : ${formatScore(q.bestScore)}`
                                    : "—"}
                                </span>
                              </div>
                              <div>
                                <span className="flex items-center gap-1.5">
                                  <Target className="h-4 w-4" />
                                  {q.attemptsCount} tentative
                                  {q.attemptsCount > 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">
                              {isExpired
                                ? "Ce quiz a expiré"
                                : "Hâte de commencer !"}
                            </span>
                          )}
                        </div>

                        {q.lastAttemptAt && (
                          <p className="flex items-center gap-1.5 text-base text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            Dernière tentative : {formatDate(q.lastAttemptAt)}
                          </p>
                        )}
                      </div>

                      {/* Desktop: button on the right */}
                      {!isExpired && (
                        <div className="hidden sm:block shrink-0">
                          <Button
                            variant={hasAttempts ? "outlineBlue" : "blue"}
                            asChild
                          >
                            <Link href={`/quiz/${q.linkToken}`}>
                              {hasAttempts ? "Recommencer" : "Commencer"}
                              <ArrowRight className="h-4 w-4 ml-1.5" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Mobile: button at the bottom */}
                    {!isExpired && (
                      <div className="sm:hidden mt-4">
                        <Button
                          variant={hasAttempts ? "outlineBlue" : "blue"}
                          asChild
                        >
                          <Link href={`/quiz/${q.linkToken}`}>
                            {hasAttempts ? "Recommencer" : "Commencer"}
                            <ArrowRight className="h-4 w-4 ml-1.5" />
                          </Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
