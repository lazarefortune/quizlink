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

export function useShowBuilderBackToTop(
  scrollContainerRef: React.RefObject<HTMLElement | null>,
  layoutKey: string | number,
  thresholdPx: number,
): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const measure = (): void => {
      const main = scrollContainerRef.current;
      const fromWindow = typeof window !== "undefined" ? window.scrollY : 0;
      const fromMain = main?.scrollTop ?? 0;
      setVisible(Math.max(fromWindow, fromMain) > thresholdPx);
    };

    measure();

    const rafId = requestAnimationFrame(measure);

    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });

    const main = scrollContainerRef.current;
    main?.addEventListener("scroll", measure, { passive: true });

    const ro =
      typeof ResizeObserver !== "undefined" && main
        ? new ResizeObserver(measure)
        : null;
    if (main && ro) {
      ro.observe(main);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      main?.removeEventListener("scroll", measure);
      ro?.disconnect();
    };
  }, [scrollContainerRef, layoutKey, thresholdPx]);

  return visible;
}

export function scrollBuilderPanelsToTop(scrollContainerRef: React.RefObject<HTMLElement | null>): void {
  scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
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
          className="fixed bottom-20 right-4 z-40 sm:bottom-10 sm:right-8"
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
