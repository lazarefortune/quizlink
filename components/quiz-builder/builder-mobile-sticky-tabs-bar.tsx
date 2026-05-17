"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { shouldPinBuilderMobileTabsBar } from "@/lib/builder/shouldPinBuilderMobileTabsBar";
import { cn } from "@/lib/utils";

type BuilderMobileStickyTabsBarProps = {
  children: ReactNode;
  className?: string;
};

type StickyMetrics = {
  height: number;
  left: number;
  width: number;
  top: number;
};

const DASHBOARD_MAIN_SCROLL_ID = "dashboard-main-scroll";

function getDashboardMainScrollRoot(): HTMLElement | null {
  return document.getElementById(DASHBOARD_MAIN_SCROLL_ID);
}

export function BuilderMobileStickyTabsBar({
  children,
  className,
}: BuilderMobileStickyTabsBarProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const flowMetricsRef = useRef<StickyMetrics>({
    height: 0,
    left: 0,
    width: 0,
    top: 0,
  });
  const [isStuck, setIsStuck] = useState(false);
  const [metrics, setMetrics] = useState<StickyMetrics>(flowMetricsRef.current);

  useEffect(() => {
    const scrollRoot = getDashboardMainScrollRoot();
    const anchor = anchorRef.current;
    if (!scrollRoot || !anchor) {
      return;
    }

    const update = (): void => {
      const rootRect = scrollRoot.getBoundingClientRect();
      const anchorRect = anchor.getBoundingClientRect();
      const shouldStick = shouldPinBuilderMobileTabsBar(anchorRect.top, rootRect.top);

      const bar = barRef.current;
      if (bar && !shouldStick) {
        const barRect = bar.getBoundingClientRect();
        flowMetricsRef.current = {
          height: barRect.height,
          left: barRect.left,
          width: barRect.width,
          top: rootRect.top,
        };
      }

      setIsStuck(shouldStick);
      setMetrics({
        ...flowMetricsRef.current,
        top: rootRect.top,
      });
    };

    update();
    scrollRoot.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    const bar = barRef.current;
    const resizeObserver =
      typeof ResizeObserver !== "undefined" && bar ? new ResizeObserver(update) : null;
    if (bar && resizeObserver) {
      resizeObserver.observe(bar);
    }

    return () => {
      scrollRoot.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      resizeObserver?.disconnect();
    };
  }, []);

  return (
    <>
      <div ref={anchorRef} className="h-0 w-full shrink-0" aria-hidden />
      {isStuck ? (
        <div
          className="w-full shrink-0 lg:hidden"
          style={{ height: metrics.height }}
          aria-hidden
        />
      ) : null}
      <div
        ref={barRef}
        className={cn(
          className,
          isStuck &&
            "fixed z-40 bg-background/95 shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-background/90 lg:static lg:shadow-none",
        )}
        style={
          isStuck
            ? {
                top: metrics.top,
                left: metrics.left,
                width: metrics.width,
              }
            : undefined
        }
      >
        {children}
      </div>
    </>
  );
}
