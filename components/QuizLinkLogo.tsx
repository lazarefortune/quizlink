"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";

export type QuizLinkLogoSize = "xs" | "sm" | "md" | "lg" | "auth" | "authCompact";

type QuizLinkLogoProps = {
  className?: string;
  size?: QuizLinkLogoSize;
  priority?: boolean;
};

const LOGO_DIMENSIONS: Record<
  QuizLinkLogoSize,
  { width: number; height: number; className: string }
> = {
  xs: { width: 88, height: 18, className: "h-[1.1em] min-h-4 max-h-5 w-auto" },
  sm: { width: 96, height: 20, className: "h-5 w-auto sm:h-5" },
  md: { width: 120, height: 24, className: "h-5 w-auto sm:h-5" },
  lg: { width: 144, height: 28, className: "h-5 w-auto sm:h-5" },
  auth: { width: 160, height: 32, className: "h-5 w-auto sm:h-5" },
  authCompact: { width: 168, height: 34, className: "h-5 w-auto sm:h-5" },
};

export function QuizLinkLogo({
  className,
  size = "md",
  priority = false,
}: QuizLinkLogoProps) {
  const dimensions = LOGO_DIMENSIONS[size];

  return (
    <span className={cn("inline-flex shrink-0 items-center", className)}>
      <Image
        src="/quizlink-inline-light.svg"
        alt="QuizLink"
        width={dimensions.width}
        height={dimensions.height}
        className={cn(dimensions.className, "dark:hidden")}
        priority={priority}
        data-testid="quizlink-logo-light"
      />
      <Image
        src="/quizlink-inline-dark.svg"
        alt=""
        aria-hidden
        width={dimensions.width}
        height={dimensions.height}
        className={cn(dimensions.className, "hidden dark:block")}
        priority={priority}
        data-testid="quizlink-logo-dark"
      />
    </span>
  );
}
