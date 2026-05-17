"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import {
  buildQuizAudienceSlices,
  buildQuizFunnelSteps,
  shouldShowQuizDetailCharts,
} from "@/lib/dashboard/quiz-detail-stats";

type QuizDetailChartsProps = {
  totalOpenCount: number;
  totalStarted: number;
  totalResponses: number;
  anonymousCompletedCount: number;
  identifiedCompletedCount: number;
};

const FUNNEL_COLORS = ["hsl(var(--primary))", "hsl(var(--blue))", "hsl(var(--highlight))"];
const PIE_COLORS = ["hsl(var(--muted-foreground))", "hsl(var(--primary))"];

export function QuizDetailCharts({
  totalOpenCount,
  totalStarted,
  totalResponses,
  anonymousCompletedCount,
  identifiedCompletedCount,
}: QuizDetailChartsProps) {
  const { locale } = useLocale();

  const funnelSteps = buildQuizFunnelSteps({
    totalOpenCount,
    totalStarted,
    totalResponses,
  });
  const audienceSlices = buildQuizAudienceSlices({
    anonymousCompletedCount,
    identifiedCompletedCount,
  });

  if (!shouldShowQuizDetailCharts(funnelSteps, audienceSlices)) {
    return null;
  }

  const funnelData = funnelSteps.map((step) => ({
    name:
      step.key === "opens"
        ? t(locale, "dashboard.opensLabel")
        : step.key === "started"
          ? t(locale, "dashboard.startedLabel")
          : t(locale, "dashboard.funnelCompletedLabel"),
    value: step.value,
  }));

  const audienceData = audienceSlices
    .filter((slice) => slice.value > 0)
    .map((slice) => ({
      name:
        slice.key === "anonymous"
          ? t(locale, "dashboard.responsesAnonymousCard")
          : t(locale, "dashboard.responsesIdentifiedCard"),
      value: slice.value,
    }));

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold">
          {t(locale, "dashboard.funnelChartTitle")}
        </h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 8 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {funnelData.map((entry, index) => (
                  <Cell key={entry.name} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {audienceData.length > 0 ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-semibold">
            {t(locale, "dashboard.audienceChartTitle")}
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={audienceData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {audienceData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </section>
  );
}
