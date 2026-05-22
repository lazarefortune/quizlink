"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

type QuizPlayResultsLayoutProps = {
  quizName: string;
  topBanner?: ReactNode;
  children: ReactNode;
};

export function QuizPlayResultsLayout({
  quizName,
  topBanner,
  children,
}: QuizPlayResultsLayoutProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-background">
      {topBanner}
      <div className="p-4 sm:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <motion.h1
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
            className="text-center text-2xl font-bold"
          >
            {quizName}
          </motion.h1>
          {children}
        </div>
      </div>
    </div>
  );
}
