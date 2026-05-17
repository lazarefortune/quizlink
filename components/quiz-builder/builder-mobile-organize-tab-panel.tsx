"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

type BuilderMobileOrganizeTabPanelProps = {
  /** Bump when the Organiser tab is opened to replay the enter animation. */
  animationKey: number;
  prefersReducedMotion: boolean | null;
  children: ReactNode;
};

export function BuilderMobileOrganizeTabPanel({
  animationKey,
  prefersReducedMotion,
  children,
}: BuilderMobileOrganizeTabPanelProps) {
  const reduceMotion = prefersReducedMotion === true;

  return (
    <motion.div
      key={animationKey}
      className="w-full min-w-0"
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.3,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}
