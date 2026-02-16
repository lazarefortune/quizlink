"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  Users,
  BarChart3,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Plus,
} from "lucide-react";

import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardStats } from "@/app/(app)/dashboard/actions";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: (delay = 0) => ({ delay, duration: 0.4 }),
};

type DashboardStats = {
  quizCount: number;
  participantCount: number;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number | null;
  completionRate: number;
  recentQuizzes: Array<{
    id: string;
    name: string;
    updatedAt: string;
    questionCount: number;
    attemptCount: number;
  }>;
};

type StatConfig = {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  href?: string;
};

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  href,
  index,
}: StatConfig & { index: number }) {
  const content = (
    <Card variant="playful" className={href ? "cursor-pointer" : undefined}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}
          >
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
        <p className="text-3xl font-black text-foreground tabular-nums">
          {value}
        </p>
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );

  const motionProps = {
    initial: fadeIn.initial,
    animate: fadeIn.animate,
    transition: fadeIn.transition(index * 0.08),
  };

  if (href) {
    return (
      <motion.div {...motionProps}>
        <Link href={href} className="block">
          {content}
        </Link>
      </motion.div>
    );
  }

  return <motion.div {...motionProps}>{content}</motion.div>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { locale } = useLocale();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const name =
    session?.user?.name?.split(" ")[0] ||
    session?.user?.email ||
    (locale === "fr" ? "tu" : "you");

  useEffect(() => {
    getDashboardStats()
      .then((result) => {
        if (result.success) {
          setStats(result.stats);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const displayStats: DashboardStats | null = stats ?? {
    quizCount: 0,
    participantCount: 0,
    totalAttempts: 0,
    completedAttempts: 0,
    averageScore: null,
    completionRate: 0,
    recentQuizzes: [],
  };

  const statCards: StatConfig[] = [
    {
      icon: FileText,
      label: locale === "fr" ? "Quiz créés" : "Quizzes created",
      value: displayStats.quizCount,
      color: "text-blue",
      bg: "bg-blue/10",
      href: "/dashboard/quizzes",
    },
    {
      icon: Users,
      label: t(locale, "dashboard.sidebar.participants"),
      value: displayStats.participantCount,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/dashboard/participants",
    },
    {
      icon: Target,
      label: locale === "fr" ? "Tentatives" : "Attempts",
      value: displayStats.totalAttempts,
      color: "text-highlight",
      bg: "bg-highlight/10",
    },
    {
      icon: displayStats.averageScore !== null ? TrendingUp : CheckCircle2,
      label:
        displayStats.averageScore !== null
          ? locale === "fr"
            ? "Score moyen"
            : "Average score"
          : locale === "fr"
            ? "Taux de complétion"
            : "Completion rate",
      value:
        displayStats.averageScore !== null
          ? `${displayStats.averageScore}%`
          : `${displayStats.completionRate}%`,
      color: "text-warning",
      bg: "bg-warning/10",
    },
  ];

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome */}
        <motion.div
          initial={fadeIn.initial}
          animate={fadeIn.animate}
          transition={fadeIn.transition(0)}
        >
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {t(locale, "dashboard.welcome.title", { name })}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {t(locale, "dashboard.welcome.subtitle")}
          </p>
        </motion.div>

        {/* Stats grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} variant="playful">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                  </div>
                  <div className="h-8 w-12 bg-muted rounded animate-pulse mb-1" />
                  <div className="h-4 w-20 bg-muted/60 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {statCards.map((s, i) => (
              <StatCard key={s.label} {...s} index={i + 1} />
            ))}
          </div>
        )}

        {/* Quick actions */}
        {!isLoading && (
          <motion.div
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            transition={fadeIn.transition(0.4)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <Link href="/dashboard/quizzes" className="block">
                <Card className="group border-2 transition-all hover:border-blue/30">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue/10">
                      <FileText className="h-5 w-5 text-blue" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">
                        {t(locale, "dashboard.welcome.myQuizzes")}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {t(locale, "dashboard.welcome.myQuizzesDesc")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/builder" className="block">
                <Card className="group border-2 transition-all hover:border-primary/30">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Plus className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">
                        {t(locale, "dashboard.welcome.createQuiz")}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {t(locale, "dashboard.welcome.createQuizDesc")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/dashboard/participants" className="block">
                <Card className="group border-2 transition-all hover:border-highlight/30">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-highlight/10">
                      <Users className="h-5 w-5 text-highlight" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-foreground">
                        {t(locale, "dashboard.welcome.participants")}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {t(locale, "dashboard.welcome.participantsDesc")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Recent quizzes */}
        {!isLoading && stats && stats.recentQuizzes.length > 0 && (
          <motion.div
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            transition={fadeIn.transition(0.5)}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-foreground">
                {locale === "fr" ? "Quiz récents" : "Recent quizzes"}
              </h2>
              <Link
                href="/dashboard/quizzes"
                className="text-sm font-bold text-blue inline-flex items-center gap-1 hover:underline"
              >
                {locale === "fr" ? "Voir tout" : "View all"}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {stats.recentQuizzes.map((quiz, i) => (
                <motion.div
                  key={quiz.id}
                  initial={fadeIn.initial}
                  animate={fadeIn.animate}
                  transition={fadeIn.transition(0.6 + i * 0.08)}
                >
                  <Link href={`/builder/${quiz.id}`}>
                    <Card className="transition-all hover:border-blue/30 group border-2">
                      <CardContent className="flex items-center justify-between gap-3 p-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-nunito font-bold text-foreground truncate text-lg">
                              {quiz.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {quiz.questionCount}{" "}
                              {quiz.questionCount === 1
                                ? t(locale, "dashboard.question")
                                : t(locale, "dashboard.questions")}
                              {" · "}
                              {quiz.attemptCount}{" "}
                              {t(locale, "dashboard.attempts")}
                              {" · "}
                              {formatDistanceToNow(new Date(quiz.updatedAt), {
                                addSuffix: true,
                                locale: locale === "fr" ? fr : enUS,
                              })}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-blue transition-colors" />
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty state */}
        {!isLoading && displayStats.quizCount === 0 && (
          <motion.div
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            transition={fadeIn.transition(0.5)}
          >
            <Card variant="playful" className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-black mb-1">
                  {locale === "fr"
                    ? "Tes stats apparaîtront ici"
                    : "Your stats will appear here"}
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  {locale === "fr"
                    ? "Crée ton premier quiz pour commencer à voir tes statistiques."
                    : "Create your first quiz to start seeing your statistics."}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="primary" asChild>
                    <Link href="/builder" className="gap-2">
                      <Plus className="h-4 w-4" />
                      {t(locale, "dashboard.welcome.createQuiz")}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/generate" className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      {locale === "fr" ? "Générer avec l'IA" : "Generate with AI"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
