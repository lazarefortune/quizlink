"use client";

import type { ReactNode, RefObject } from "react";

import { cn } from "@/lib/utils";

type QuizPlayLayoutProps = {
  children: ReactNode;
  topBanner?: ReactNode;
  className?: string;
  isInteractionBlocked?: boolean;
  containerRef?: RefObject<HTMLDivElement | null>;
};

export function QuizPlayLayout({
  children,
  topBanner,
  className,
  isInteractionBlocked = false,
  containerRef,
}: QuizPlayLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {topBanner}
      <div
        ref={containerRef}
        className={cn(
          "px-4 py-6 pb-28 sm:p-8",
          isInteractionBlocked && "pointer-events-none select-none",
          className,
        )}
      >
        <div className="mx-auto w-full max-w-none space-y-6 md:max-w-3xl">
          {children}
        </div>
      </div>
    </div>
  );
}
