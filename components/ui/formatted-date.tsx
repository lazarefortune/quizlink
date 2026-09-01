"use client";

import { formatDateTime } from "@/lib/formatDateTime";

type FormattedDateProps = {
  date: Date | string | null;
  locale: string;
  className?: string;
};

/**
 * Renders a localized date+time in the app timezone.
 * suppressHydrationWarning remains as a safety net for rare locale edge cases.
 */
export function FormattedDate({
  date,
  locale,
  className,
}: FormattedDateProps): React.ReactElement {
  if (date == null) {
    return <span className={className}>-</span>;
  }
  return (
    <span className={className} suppressHydrationWarning>
      {formatDateTime(date, locale)}
    </span>
  );
}
