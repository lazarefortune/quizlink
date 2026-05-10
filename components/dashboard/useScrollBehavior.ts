"use client";

import { useEffect, useRef, useState } from "react";

type ScrollBehaviorResult = {
  isHeaderVisible: boolean;
  isScrolledDown: boolean;
};

const HIDE_TRIGGER_PX = 60;
const SHOW_TRIGGER_PX = 300;
const DELTA_THRESHOLD = 6;

export function useScrollBehavior(): ScrollBehaviorResult {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const getScrollRoot = (): HTMLElement | null =>
      document.getElementById("dashboard-main-scroll");

    const handleScroll = (currentY: number) => {
      const delta = currentY - lastScrollY.current;

      if (delta > DELTA_THRESHOLD && currentY > HIDE_TRIGGER_PX) {
        setIsHeaderVisible(false);
      } else if (delta < -DELTA_THRESHOLD || currentY <= HIDE_TRIGGER_PX) {
        setIsHeaderVisible(true);
      }

      setIsScrolledDown(currentY > SHOW_TRIGGER_PX);
      lastScrollY.current = currentY;
    };

    let detach: (() => void) | undefined;

    const attach = (): void => {
      const root = getScrollRoot();
      const onScroll = () => {
        const y = root ? root.scrollTop : window.scrollY;
        handleScroll(y);
      };

      if (root) {
        root.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        detach = () => root.removeEventListener("scroll", onScroll);
        return;
      }

      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      detach = () => window.removeEventListener("scroll", onScroll);
    };

    const timer = window.setTimeout(attach, 0);

    return () => {
      window.clearTimeout(timer);
      detach?.();
    };
  }, []);

  return { isHeaderVisible, isScrolledDown };
}
