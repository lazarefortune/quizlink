"use client";

import { useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";

import {
  QuizDetailKpiAnonymousIcon,
  QuizDetailKpiAverageScoreIcon,
  QuizDetailKpiBestScoreIcon,
  QuizDetailKpiCompletionIcon,
  QuizDetailKpiDurationIcon,
  QuizDetailKpiGamesIcon,
  QuizDetailKpiOpensIcon,
  QuizDetailKpiStartedIcon,
  QuizDetailKpiWorstScoreIcon,
} from "@/components/dashboard/quiz-detail/quiz-detail-kpi-icons";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";
import {
  computeQuizCompletionRatePercent,
  formatDurationShort,
  type QuizDetailStatsInput,
} from "@/lib/dashboard/quiz-detail-stats";

type QuizDetailKpiGridProps = {
  stats: QuizDetailStatsInput;
  /** When true, extra KPIs can be revealed via toggle (e.g. unlocked quiz). */
  moreStatsAvailable?: boolean;
};

type KpiCardProps = {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
  index?: number;
  prefersReducedMotion: boolean | null;
};

const KPI_CARD_SPRING = {
  type: "spring" as const,
  stiffness: 420,
  damping: 22,
  mass: 0.85,
};

function KpiCard({
  label,
  value,
  icon: Icon,
  index = 0,
  prefersReducedMotion,
}: KpiCardProps) {
  const entranceDelay = prefersReducedMotion ? 0 : index * 0.07;

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        ...KPI_CARD_SPRING,
        delay: entranceDelay,
      }}
      className="rounded-xl border-2 border-border bg-card p-4"
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="shrink-0">
            <Icon className="shrink-0" />
          </div>
        ) : null}
        <div className="min-w-0">
          <motion.p
            className="truncate text-lg font-semibold tabular-nums leading-tight text-foreground sm:text-xl"
            initial={prefersReducedMotion ? false : { opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              ...KPI_CARD_SPRING,
              delay: entranceDelay + 0.12,
            }}
          >
            {value}
          </motion.p>
          <motion.p
            className="mt-0.5 text-base leading-snug text-muted-foreground"
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: entranceDelay + 0.18 }}
          >
            {label}
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

const ADVANCED_KPI_MOTION = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0 },
} as const;

export function QuizDetailKpiGrid({
  stats,
  moreStatsAvailable = false,
}: QuizDetailKpiGridProps) {
  const { locale } = useLocale();
  const prefersReducedMotion = useReducedMotion();
  const [isExpanded, setIsExpanded] = useState(false);
  const completionRate =
    stats.completionRatePercent > 0
      ? stats.completionRatePercent
      : computeQuizCompletionRatePercent(stats);

  const motionTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };

  return (
    <div className="space-y-3">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label={t(locale, "dashboard.kpiGamesPlayed")}
          value={String(stats.totalResponses)}
          icon={QuizDetailKpiGamesIcon}
          index={0}
          prefersReducedMotion={prefersReducedMotion}
        />
        <KpiCard
          label={t(locale, "dashboard.kpiAverageScore")}
          value={
            stats.globalScoredCount > 0
              ? `${stats.globalScoreAverage.toFixed(1)}%`
              : "-"
          }
          icon={QuizDetailKpiAverageScoreIcon}
          index={1}
          prefersReducedMotion={prefersReducedMotion}
        />
        <KpiCard
          label={t(locale, "dashboard.kpiCompletionRate")}
          value={`${completionRate.toFixed(1)}%`}
          icon={QuizDetailKpiCompletionIcon}
          index={2}
          prefersReducedMotion={prefersReducedMotion}
        />
        <KpiCard
          label={t(locale, "dashboard.kpiAverageDuration")}
          value={
            stats.globalAverageDurationSeconds != null
              ? formatDurationShort(stats.globalAverageDurationSeconds)
              : "-"
          }
          icon={QuizDetailKpiDurationIcon}
          index={3}
          prefersReducedMotion={prefersReducedMotion}
        />
      </section>

      <AnimatePresence initial={false}>
        {moreStatsAvailable && isExpanded ? (
          <motion.div
            key="quiz-detail-kpi-advanced"
            data-testid="quiz-detail-kpi-advanced"
            className="overflow-hidden"
            initial={prefersReducedMotion ? false : ADVANCED_KPI_MOTION.initial}
            animate={ADVANCED_KPI_MOTION.animate}
            exit={prefersReducedMotion ? undefined : ADVANCED_KPI_MOTION.exit}
            transition={motionTransition}
          >
            <section className="grid gap-3 pt-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <KpiCard
                label={t(locale, "dashboard.kpiAnonymousGames")}
                value={String(stats.anonymousCompletedCount)}
                icon={QuizDetailKpiAnonymousIcon}
                index={0}
                prefersReducedMotion={prefersReducedMotion}
              />
              <KpiCard
                label={t(locale, "dashboard.kpiQuizOpens")}
                value={String(stats.totalOpenCount)}
                icon={QuizDetailKpiOpensIcon}
                index={1}
                prefersReducedMotion={prefersReducedMotion}
              />
              <KpiCard
                label={t(locale, "dashboard.kpiGamesStarted")}
                value={String(stats.totalStarted)}
                icon={QuizDetailKpiStartedIcon}
                index={2}
                prefersReducedMotion={prefersReducedMotion}
              />
              <KpiCard
                label={t(locale, "dashboard.kpiBestScore")}
                value={
                  stats.globalBestScore != null
                    ? `${stats.globalBestScore.toFixed(1)}%`
                    : "-"
                }
                icon={QuizDetailKpiBestScoreIcon}
                index={3}
                prefersReducedMotion={prefersReducedMotion}
              />
              <KpiCard
                label={t(locale, "dashboard.kpiWorstScore")}
                value={
                  stats.globalLowestScore != null
                    ? `${stats.globalLowestScore.toFixed(1)}%`
                    : "-"
                }
                icon={QuizDetailKpiWorstScoreIcon}
                index={4}
                prefersReducedMotion={prefersReducedMotion}
              />
            </section>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {moreStatsAvailable ? (
        <div className="flex justify-center sm:justify-start">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-300 ease-out",
                isExpanded && "rotate-180",
              )}
              aria-hidden
            />
            {isExpanded
              ? t(locale, "dashboard.showLessStats")
              : t(locale, "dashboard.showMoreStats")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
