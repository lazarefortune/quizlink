"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { track } from "@/lib/analytics/track";
import { PAGE_VIEW } from "@/lib/analytics/events";

export function PostHogPageView(): null {
  const pathname = usePathname();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (lastPathRef.current === pathname) return;
    lastPathRef.current = pathname;

    const search = typeof window !== "undefined" ? window.location.search : "";
    const referrer =
      typeof document !== "undefined" ? document.referrer || undefined : undefined;

    track(PAGE_VIEW, {
      path: pathname,
      search: search || undefined,
      referrer,
    });
  }, [pathname]);

  return null;
}
