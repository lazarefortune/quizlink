"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { getUserQuizzes } from "@/app/builder/actions";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { Plus, Eye, BarChart3, Users, FileText, Sparkles } from "lucide-react";
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

export default function DashboardPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const [quizzes, setQuizzes] = useState<QuizWithAttempts[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const handleEdit = (quizId: string) => {
    router.push(`/builder/${quizId}`);
  };

  const handleView = (quiz: QuizWithAttempts) => {
    router.push(`/builder/${quiz.id}`);
  };

  const handleStats = (quizId: string) => {
    router.push(`/dashboard/quiz/${quizId}`);
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <p>{t(locale, "common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{t(locale, "dashboard.title")}</h1>
            <p className="text-base text-muted-foreground mt-1 sm:mt-2">
              {t(locale, "dashboard.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/participants" className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t(locale, "dashboard.participants")}</span>
                <span className="sm:hidden">{t(locale, "dashboard.participants")}</span>
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="primary" className="w-full sm:w-auto gap-2">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t(locale, "nav.create")}</span>
                  <span className="sm:hidden">{t(locale, "nav.create")}</span>
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
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 px-4">
              <p className="text-base text-muted-foreground mb-4 text-center">
                {t(locale, "dashboard.noQuizzes")}
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="primary" className="w-full sm:w-auto gap-2">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {quizzes.map((quiz) => (
              <Card key={quiz.id} className="flex flex-col h-full">
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg line-clamp-2 break-words">{quiz.name}</CardTitle>
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1 space-y-1">
                        <div>
                          {quiz.questions.length} {quiz.questions.length === 1 ? t(locale, "dashboard.question") : t(locale, "dashboard.questions")}
                        </div>
                        <div>
                          {`${quiz.attempts.length} ${t(locale, "dashboard.attempts")}`}
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <QuizOptionsMenu
                        quizId={quiz.id}
                        quizName={quiz.name}
                        visibility={quiz.visibility}
                        onDeleted={() => {
                          loadQuizzes();
                        }}
                        onDuplicated={(newQuizId) => {
                          // Quiz will be loaded in the builder
                        }}
                        onEdit={() => handleEdit(quiz.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 space-y-3 sm:space-y-4 pt-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {t(locale, "dashboard.visibility")}:
                    </span>
                    <Badge variant={quiz.visibility === "PUBLIC" ? "default" : "outline"} className="text-xs">
                      {quiz.visibility === "PUBLIC"
                        ? t(locale, "dashboard.public")
                        : t(locale, "dashboard.private")}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 mt-auto">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleView(quiz)}
                      className="w-full text-xs sm:text-sm"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      {t(locale, "dashboard.view")}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleStats(quiz.id)}
                      className="w-full text-xs sm:text-sm"
                    >
                      <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      {t(locale, "dashboard.statistics")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
