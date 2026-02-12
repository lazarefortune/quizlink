"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  FileText,
  Users,
  BarChart3,
  Target,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardStats } from "@/app/(app)/dashboard/actions";
import { formatDistanceToNow } from "date-fns";
import { fr, enUS } from "date-fns/locale";

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

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  href?: string;
}) {
  const content = (
    <Card
      className={
        href
          ? "transition-shadow hover:shadow-md cursor-pointer"
          : undefined
      }
    >
      <CardContent className="flex items-start gap-4 p-4 sm:p-5">
        <div
          className={`flex py-2.5 ${color}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-2xl h2 font-bold text-neutral-600 dark:text-white tabular-nums">{value}</p>
          <p className="text-base text-muted-foreground truncate">{label}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
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

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="space-y-6 sm:space-y-8">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl h1 font-semibold tracking-tight sm:text-3xl">
            {t(locale, "dashboard.welcome.title", { name })}
          </h1>
        </div>

        {/* Stats grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="h-11 w-11 rounded-xl bg-muted animate-pulse shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                    <div className="h-7 w-10 bg-muted rounded animate-pulse" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              icon={FileText}
              label={locale === "fr" ? "Quiz créés" : "Quizzes created"}
              value={stats.quizCount}
              color="text-blue"
              href="/dashboard/quizzes"
            />
            <StatCard
              icon={Users}
              label={t(locale, "dashboard.sidebar.participants")}
              value={stats.participantCount}
              color="text-primary"
              href="/dashboard/participants"
            />
            <StatCard
              icon={Target}
              label={locale === "fr" ? "Tentatives" : "Attempts"}
              value={stats.totalAttempts}
              color="text-highlight"
            />
            <StatCard
              icon={stats.averageScore !== null ? TrendingUp : CheckCircle2}
              label={
                stats.averageScore !== null
                  ? locale === "fr"
                    ? "Score moyen"
                    : "Average score"
                  : locale === "fr"
                    ? "Taux de complétion"
                    : "Completion rate"
              }
              value={
                stats.averageScore !== null
                  ? `${stats.averageScore}%`
                  : `${stats.completionRate}%`
              }
                color="text-warning"
            />
          </div>
        ) : null}

        {/* Recent quizzes */}
        {!isLoading && stats && stats.recentQuizzes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {locale === "fr" ? "Quiz récents" : "Recent quizzes"}
              </h2>
              <Link
                href="/dashboard/quizzes"
                className="text-sm font-medium text-blue inline-flex items-center gap-1 hover:underline"
              >
                {locale === "fr" ? "Voir tout" : "View all"}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-2 flex flex-col gap-2">
              {stats.recentQuizzes.map((quiz) => (
                <Link key={quiz.id} href={`/builder/${quiz.id}`}>
                  <Card className="transition-shadow hover:shadow-md">
                    <CardContent className="flex items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{quiz.name}</p>
                          <p className="text-xs text-muted-foreground">
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
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        {!isLoading && stats && stats.quizCount === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <BarChart3 className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {locale === "fr"
                  ? "Tes stats apparaîtront ici"
                  : "Your stats will appear here"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {locale === "fr"
                  ? "Crée ton premier quiz pour commencer à voir tes statistiques."
                  : "Create your first quiz to start seeing your statistics."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
