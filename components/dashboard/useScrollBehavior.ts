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
    const handleScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      if (delta > DELTA_THRESHOLD && currentY > HIDE_TRIGGER_PX) {
        setIsHeaderVisible(false);
      } else if (delta < -DELTA_THRESHOLD || currentY <= HIDE_TRIGGER_PX) {
        setIsHeaderVisible(true);
      }

      setIsScrolledDown(currentY > SHOW_TRIGGER_PX);
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { isHeaderVisible, isScrolledDown };
}
