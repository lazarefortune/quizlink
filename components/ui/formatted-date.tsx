"use client";

type FormattedDateProps = {
  date: Date | string | null;
  locale: string;
  className?: string;
};

/**
 * Renders a localized date with suppressHydrationWarning to avoid React #418
 * when server and client disagree on locale/timezone.
 */
export function FormattedDate({
  date,
  locale,
  className,
}: FormattedDateProps): React.ReactElement {
  if (date == null) {
    return <span className={className}>-</span>;
  }
  const d = typeof date === "string" ? new Date(date) : date;
  const formatted = d.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <span className={className} suppressHydrationWarning>
      {formatted}
    </span>
  );
}
