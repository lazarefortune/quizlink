"use client";

import { formatDate } from "@/lib/date-time/format";
import { useTimeZone } from "@/lib/date-time/timezone-provider";

export function LegalLastUpdatedDate(): React.ReactElement {
  const { timeZone } = useTimeZone();
  return <>{formatDate(new Date(), "fr", timeZone)}</>;
}
