export type DailySignupPoint = {
  dateKey: string;
  label: string;
  signups: number;
};

function toLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildDailySignupSeries(
  eventDates: Date[],
  days: number,
  locale: "fr" | "en"
): DailySignupPoint[] {
  const byDay = new Map<string, number>();
  for (const date of eventDates) {
    const dayKey = toLocalDateKey(date);
    byDay.set(dayKey, (byDay.get(dayKey) ?? 0) + 1);
  }

  const formatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    month: "short",
    day: "numeric",
  });

  const today = new Date();
  const series: DailySignupPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(today);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const dateKey = toLocalDateKey(date);
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
