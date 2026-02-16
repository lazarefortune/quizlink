"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
import { QuizOptionsMenu } from "@/components/quiz-options-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35 },
  }),
};

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

function CreateQuizModalTrigger({
  locale,
  variant = "blue",
  size = "sm",
}: {
  locale: Locale;
  variant?: "blue" | "primary";
  size?: "sm" | "default";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" />
        {t(locale, "nav.create")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-black">
              {locale === "fr" ? "Crée ton quiz !" : "Create your quiz!"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 pt-2 pb-1">
            <Link
              href="/builder"
              onClick={() => setOpen(false)}
              className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-5 transition-all hover:border-primary hover:shadow-md active:scale-[0.97]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <FileText className="h-7 w-7" />
              </span>
              <div className="text-center">
                <p className="text-sm font-semibold">
                  {t(locale, "nav.createManually")}
                </p>
              </div>
            </Link>
            <Link
              href="/generate"
              onClick={() => setOpen(false)}
              className="group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-5 transition-all hover:border-blue hover:shadow-md active:scale-[0.97]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue/10 text-blue transition-colors group-hover:bg-blue/20">
                <Sparkles className="h-7 w-7" />
              </span>
              <div className="text-center">
                <p className="text-sm font-semibold">
                  {t(locale, "nav.createWithAI")}
                </p>
              </div>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
            <Card key={i} variant="playful">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
                  <div className="h-8 w-8 bg-muted rounded-md animate-pulse" />
                </div>
                <div className="h-5 w-4/5 bg-muted rounded animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
                  <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <motion.div
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Header */}
        <motion.div
          custom={0}
          variants={fadeUp}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">
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
            <CreateQuizModalTrigger locale={locale} />
          </div>
        </motion.div>

        {/* Empty state */}
        {quizzes.length === 0 ? (
          <motion.div custom={1} variants={fadeUp}>
            <Card variant="playful" className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                  <FileQuestion className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-black mb-1">
                  {t(locale, "dashboard.noQuizzes")}
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm mb-6">
                  {locale === "fr"
                    ? "Crée ton premier quiz manuellement ou avec l'IA pour commencer."
                    : "Create your first quiz manually or with AI to get started."}
                </p>
                <CreateQuizModalTrigger
                  locale={locale}
                  variant="primary"
                  size="default"
                />
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Quiz grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
            {quizzes.map((quiz, i) => (
              <motion.div key={quiz.id} custom={i + 1} variants={fadeUp}>
                <Card
                  variant="playful"
                  className="group flex flex-col h-full"
                >
                  <CardContent className="flex flex-col flex-1 p-5">
                    {/* Quiz name */}
                    <Link
                      href={`/dashboard/quiz/${quiz.id}`}
                      className="block flex-1 mb-4"
                    >
                      <h3 className="text-lg font-bold leading-snug line-clamp-2 wrap-break-word text-foreground group-hover:text-blue transition-colors">
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
                          quiz.visibility === "PUBLIC"
                            ? "default"
                            : "destructive"
                        }
                        className="text-sm"
                      >
                        {quiz.visibility === "PUBLIC" ? (
                          <Globe className="h-3.5 w-3.5" />
                        ) : (
                          <Lock className="h-3.5 w-3.5" />
                        )}
                        <span className="ml-2">
                          {quiz.visibility === "PUBLIC"
                            ? t(locale, "dashboard.public")
                            : t(locale, "dashboard.private")}
                        </span>
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
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
