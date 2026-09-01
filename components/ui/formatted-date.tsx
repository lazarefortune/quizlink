"use client";

import { formatDate, formatDateTime } from "@/lib/date-time/format";
import { useTimeZone } from "@/lib/date-time/timezone-provider";

type FormattedDateProps = {
  date: Date | string | null;
  locale: string;
  className?: string;
};

/** Renders a localized date+time using the global request timezone context. */
export function FormattedDate({
  date,
  locale,
  className,
}: FormattedDateProps): React.ReactElement {
  const { timeZone } = useTimeZone();

  if (date == null) {
    return <span className={className}>-</span>;
  }

  return (
    <span className={className}>
      {formatDateTime(date, locale, timeZone)}
    </span>
  );
}

type FormattedDateOnlyProps = {
  date: Date | string | null;
  locale: string;
  className?: string;
};

/** Renders a localized date (no time) using the global request timezone context. */
export function FormattedDateOnly({
  date,
  locale,
  className,
}: FormattedDateOnlyProps): React.ReactElement {
  const { timeZone } = useTimeZone();

  if (date == null) {
    return <span className={className}>-</span>;
  }

  return (
    <span className={className}>
      {formatDate(date, locale, timeZone)}
    </span>
  );
}
