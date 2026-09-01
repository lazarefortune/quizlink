"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { syncTimeZoneAction } from "./actions";
import { detectBrowserTimeZone, isValidTimeZone } from "./timezone";
import { useTimeZone } from "./timezone-provider";

type TimeZoneSyncProps = {
  initialTimeZone: string;
};

/**
 * After hydration, syncs the browser timezone to the server cookie when it differs.
 * Uses the server-provided timezone for the first render to avoid hydration mismatches.
 */
export function TimeZoneSync({
  initialTimeZone,
}: TimeZoneSyncProps): null {
  const router = useRouter();
  const { timeZone, setTimeZone } = useTimeZone();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (hasSyncedRef.current) {
      return;
    }
    hasSyncedRef.current = true;

    const browserTimeZone = detectBrowserTimeZone();
    if (!isValidTimeZone(browserTimeZone)) {
      return;
    }

    if (browserTimeZone === initialTimeZone) {
      return;
    }

    void syncTimeZoneAction(browserTimeZone).then((result) => {
      if (!result.success) {
        return;
      }
      if (browserTimeZone !== timeZone) {
        setTimeZone(browserTimeZone);
      }
      router.refresh();
    });
  }, [initialTimeZone, router, setTimeZone, timeZone]);

  return null;
}
