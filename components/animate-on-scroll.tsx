"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnimateOnScrollProps = {
  children: ReactNode;
  className?: string;
  /** Delay before animation starts (ms). Default 0. */
  delay?: number;
  /** Root margin for observer (e.g. "0px 0px -40px 0px" to trigger a bit before visible). Default "-24px". */
  rootMargin?: string;
};

export function AnimateOnScroll({
  children,
  className,
  delay = 0,
  rootMargin = "0px 0px -24px 0px",
}: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        if (delay > 0) {
          timeoutRef.current = setTimeout(() => setVisible(true), delay);
        } else {
          setVisible(true);
        }
      },
      { rootMargin, threshold: 0.1 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [rootMargin, delay]);

  return (
    <div
      ref={ref}
      className={cn("animate-reveal", visible && "is-visible", className)}
    >
      {children}
    </div>
  );
}
