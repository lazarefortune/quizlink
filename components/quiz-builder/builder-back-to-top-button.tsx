"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

type BuilderBackToTopButtonProps = {
  scrollContainerRef: React.RefObject<HTMLElement | null>;
  /** Re-subscribe when layout/content changes (e.g. question count, tab). */
  layoutKey: string | number;
  thresholdPx?: number;
  label: string;
};

const DEFAULT_BACK_TO_TOP_THRESHOLD = 420;

/** Matches `id` on the dashboard shell scroll region (`dashboard-mobile-scroll-layout`). */
const DASHBOARD_MAIN_SCROLL_ID = "dashboard-main-scroll";

function resolveScrollContainer(
  scrollContainerRef: React.RefObject<HTMLElement | null>,
): HTMLElement | null {
  if (scrollContainerRef.current) {
    return scrollContainerRef.current;
  }
  if (typeof document === "undefined") {
    return null;
  }
  return document.getElementById(DASHBOARD_MAIN_SCROLL_ID);
}

export function useShowBuilderBackToTop(
  scrollContainerRef: React.RefObject<HTMLElement | null>,
  layoutKey: string | number,
  thresholdPx: number,
): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let attachedScrollRoot: HTMLElement | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const measure = (): void => {
      const scrollRoot = resolveScrollContainer(scrollContainerRef);
      const fromWindow = typeof window !== "undefined" ? window.scrollY : 0;
      const fromMain = scrollRoot?.scrollTop ?? 0;
      setVisible(Math.max(fromWindow, fromMain) > thresholdPx);
    };

    const attach = (): void => {
      measure();

      window.addEventListener("scroll", measure, { passive: true });
      window.addEventListener("resize", measure, { passive: true });

      attachedScrollRoot = resolveScrollContainer(scrollContainerRef);
      attachedScrollRoot?.addEventListener("scroll", measure, { passive: true });

      if (typeof ResizeObserver !== "undefined" && attachedScrollRoot) {
        resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(attachedScrollRoot);
      }
    };

    const rafId = requestAnimationFrame(measure);
    const attachTimer = window.setTimeout(attach, 0);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(attachTimer);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      attachedScrollRoot?.removeEventListener("scroll", measure);
      resizeObserver?.disconnect();
    };
  }, [scrollContainerRef, layoutKey, thresholdPx]);

  return visible;
}

export function scrollBuilderPanelsToTop(scrollContainerRef: React.RefObject<HTMLElement | null>): void {
  const scrollRoot = resolveScrollContainer(scrollContainerRef);
  scrollRoot?.scrollTo({ top: 0, behavior: "smooth" });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function BuilderBackToTopButton({
  scrollContainerRef,
  layoutKey,
  thresholdPx = DEFAULT_BACK_TO_TOP_THRESHOLD,
  label,
}: BuilderBackToTopButtonProps) {
  const visible = useShowBuilderBackToTop(scrollContainerRef, layoutKey, thresholdPx);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          key="builder-back-to-top"
          role="presentation"
          initial={{ opacity: 0, scale: 0.82, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.82, y: 16 }}
          transition={{ type: "spring", stiffness: 460, damping: 32 }}
          className="fixed bottom-10 right-8 z-40 hidden lg:block"
        >
          <Button
            type="button"
            variant="blue"
            size="icon"
            className="h-12 w-12 rounded-full shadow-lg"
            onClick={() => scrollBuilderPanelsToTop(scrollContainerRef)}
            aria-label={label}
            title={label}
          >
            <ArrowUp className="h-5 w-5" />
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
