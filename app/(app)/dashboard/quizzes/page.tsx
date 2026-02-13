"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getUserQuizzes } from "@/app/(app)/builder/actions";
import { useLocale } from "@/lib/i18n/use-locale";
import { t, type Locale } from "@/lib/i18n";
import {
  Plus,
  FileText,
  Sparkles,
  FileQuestion,
  Users,
  MessageSquare,
  Globe,
  Lock,
} from "lucide-react";
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

function CreateQuizDropdown({
  locale,
  variant = "blue",
  size = "sm",
  align = "end",
}: {
  locale: Locale;
  variant?: "blue" | "primary";
  size?: "sm" | "default";
  align?: "start" | "center" | "end";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          <Plus className="h-4 w-4" />
          {t(locale, "nav.create")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align}>
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
  );
}

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
        <div className="flex items-end justify-between mb-6">
          <div className="h-8 w-40 bg-muted rounded-lg animate-pulse" />
          <div className="h-9 w-28 bg-muted rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="rounded-xl border-2 border-border bg-card p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                <div className="h-8 w-8 bg-muted rounded-md animate-pulse" />
              </div>
              <div className="h-5 w-4/5 bg-muted rounded animate-pulse" />
              <div className="flex gap-4">
                <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
                <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl h1 font-semibold sm:text-3xl">
              {t(locale, "dashboard.title")}
            </h2>
            <Link
              href="/quizzes"
              className="md:hidden inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
            >
              <Globe className="h-4 w-4 shrink-0" />
              {t(locale, "dashboard.sidebar.community")}
            </Link>
          </div>
          <div className="shrink-0">
            <CreateQuizDropdown locale={locale} />
          </div>
        </div>

        {/* Empty state */}
        {quizzes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileQuestion className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {t(locale, "dashboard.noQuizzes")}
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                {locale === "fr"
                  ? "Crée ton premier quiz manuellement ou avec l'IA pour commencer."
                  : "Create your first quiz manually or with AI to get started."}
              </p>
              <CreateQuizDropdown
                locale={locale}
                variant="primary"
                size="default"
                align="center"
              />
            </CardContent>
          </Card>
        ) : (
          /* Quiz grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="group flex flex-col transition-all border-b-4"
              >
                <CardContent className="flex flex-col flex-1 p-5">
                  {/* Quiz name — links to quiz details */}
                  <Link
                    href={`/dashboard/quiz/${quiz.id}`}
                    className="block flex-1 mb-4"
                  >
                    <h3 className="text-lg text-neutral-600 dark:text-neutral-100 font-semibold leading-snug line-clamp-2 wrap-break-word group-hover:text-blue transition-colors">
                      {quiz.name}
                    </h3>
                  </Link>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="inline-flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {quiz.questions.length}{" "}
                      {quiz.questions.length === 1
                        ? t(locale, "dashboard.question")
                        : t(locale, "dashboard.questions")}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {quiz.attempts.length}{" "}
                      {t(locale, "dashboard.attempts")}
                    </span>
                  </div>

                  {/* Bottom row: badge + menu */}
                  <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/60">
                    <Badge
                      variant={
                        quiz.visibility === "PUBLIC" ? "default" : "destructive"
                      }
                      className="text-sm"
                    >
                      {quiz.visibility === "PUBLIC" ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      <span className="ml-2">{quiz.visibility === "PUBLIC" ? t(locale, "dashboard.public") : t(locale, "dashboard.private")}</span>
                    </Badge>
                    <QuizOptionsMenu
                      quizId={quiz.id}
                      quizName={quiz.name}
                      visibility={quiz.visibility}
                      onDeleted={() => loadQuizzes()}
                      onDuplicated={() => {}}
                      onEdit={() => handleEdit(quiz.id)}
                    />
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
