"use client";

import Link from "next/link";
import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";
import { ThemeToggle } from "@/components/theme-toggle";

export function QuizPageHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container max-w-2xl mx-auto px-4 flex items-center justify-between h-14">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
          aria-label="Retour à l'accueil"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <span className="font-heading text-lg font-bold text-primary-foreground">Q</span>
          </div>
          <span className="text-2xl font-bold tracking-tight text-foreground">
            <BrandQuizLinkText />
          </span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
