import { toDateKeyInTimeZone } from "@/lib/date-time/timezone";

export type DailySignupPoint = {
  dateKey: string;
  label: string;
  signups: number;
};

export function buildDailySignupSeries(
  eventDates: Date[],
  days: number,
  locale: "fr" | "en",
  timeZone: string,
): DailySignupPoint[] {
  const byDay = new Map<string, number>();
  for (const date of eventDates) {
    const dayKey = toDateKeyInTimeZone(date, timeZone);
    byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + 1);
  }

  const formatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    timeZone,
    month: "short",
    day: "numeric",
  });

  const now = new Date();
  const series: DailySignupPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = toDateKeyInTimeZone(date, timeZone);
    series.push({
      dateKey,
      label: formatter.format(date),
      signups: byDay.get(dateKey) ?? 0,
    });
  }

  return series;
}

export function normalizePageSize(input: string | undefined): number {
  const allowed = [10, 25, 50, 100] as const;
  const value = Number(input);
  return allowed.includes(value as (typeof allowed)[number]) ? value : 25;
}

export function normalizePage(input: string | undefined): number {
  const parsed = Number(input);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
}
