"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserQuizzes } from "@/app/builder/actions";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { Plus, BarChart3, Users, FileText, Sparkles, FileQuestion, ArrowRight } from "lucide-react";
import Link from "next/link";
import { QuizOptionsMenu } from "@/components/quiz-options-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type QuizWithAttempts = {
  id: string;
  name: string;
  visibility: "PRIVATE" | "PUBLIC";
  questions: Array<{
    id: string;
    type: string;
    label: string;
    image?: string;
    options: Array<{
      id: string;
      label: string;
      isCorrect: boolean;
    }>;
  }>;
  attempts: Array<{
    id: string;
    participantName: string;
    startedAt: Date;
    finishedAt: Date | null;
    score: number | null;
    status: string;
  }>;
  createdAt: string;
};

export default function DashboardQuizzesPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [quizzes, setQuizzes] = useState<QuizWithAttempts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleEdit = (quizId: string) => {
    router.push(`/builder/${quizId}`);
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  async function loadQuizzes() {
    setIsLoading(true);
    try {
      const result = await getUserQuizzes();
      if (result.success) {
        setQuizzes(result.quizzes);
      } else {
        console.error("Failed to load quizzes:", result.error);
      }
    } catch (error) {
      console.error("Error loading quizzes:", error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-5 md:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="h-8 w-48 bg-muted rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-56 bg-muted/70 rounded animate-pulse mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl border bg-card overflow-hidden">
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted/70 rounded animate-pulse" />
                  <div className="h-8 w-full bg-muted/50 rounded-md animate-pulse mt-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold sm:text-2xl">
              {t(locale, "dashboard.title")}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t(locale, "dashboard.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Link href="/dashboard/participants">
              <Button variant="secondary" size="sm" className="gap-2">
                <Users className="h-4 w-4" />
                {t(locale, "dashboard.participants")}
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="primary" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t(locale, "nav.create")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/builder" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t(locale, "nav.createManually")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/generate" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {t(locale, "nav.createWithAI")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {quizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileQuestion className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">{t(locale, "dashboard.noQuizzes")}</h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                {locale === "fr"
                  ? "Crée ton premier quiz manuellement ou avec l'IA pour commencer."
                  : "Create your first quiz manually or with AI to get started."}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="primary" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t(locale, "nav.create")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center">
                  <DropdownMenuItem asChild>
                    <Link href="/builder" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t(locale, "nav.createManually")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/generate" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      {t(locale, "nav.createWithAI")}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="flex flex-col h-full overflow-hidden transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0 pr-1">
                      <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2 break-words">
                        {quiz.name}
                      </CardTitle>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>
                          {quiz.questions.length}{" "}
                          {quiz.questions.length === 1
                            ? t(locale, "dashboard.question")
                            : t(locale, "dashboard.questions")}
                        </span>
                        <span>·</span>
                        <span>
                          {quiz.attempts.length} {t(locale, "dashboard.attempts")}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <QuizOptionsMenu
                        quizId={quiz.id}
                        quizName={quiz.name}
                        visibility={quiz.visibility}
                        onDeleted={() => loadQuizzes()}
                        onDuplicated={() => {}}
                        onEdit={() => handleEdit(quiz.id)}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge
                      variant={quiz.visibility === "PUBLIC" ? "default" : "secondary"}
                      className="text-xs font-normal"
                    >
                      {quiz.visibility === "PUBLIC"
                        ? t(locale, "dashboard.public")
                        : t(locale, "dashboard.private")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 mt-auto">
                  <Link href={`/dashboard/quiz/${quiz.id}`} className="block">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full gap-2 text-xs sm:text-sm"
                    >
                      <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {t(locale, "dashboard.statistics")}
                      <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-auto" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
