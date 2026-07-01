"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bird, Plus } from "lucide-react";

import { CreateQuizModalTrigger } from "@/components/dashboard/create-quiz-modal-trigger";
import type { DashboardWelcomeGreetingKey } from "@/lib/dashboardWelcomeGreeting";
import { t, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type DashboardWelcomeBannerProps = {
  name: string;
  welcomeGreetingKey: DashboardWelcomeGreetingKey;
  subtitle: string;
  locale: Locale;
  className?: string;
};

export function DashboardWelcomeBanner({
  name,
  welcomeGreetingKey,
  subtitle,
  locale,
  className,
}: DashboardWelcomeBannerProps) {
  const [mascotError, setMascotError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden py-4", className)}>
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 sm:-right-8 sm:-top-16 sm:h-72 sm:w-72"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-24 top-4 h-32 w-32 rounded-full bg-primary/5 sm:right-32 sm:top-8"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-4">
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {t(locale, welcomeGreetingKey)}
            <span className="capitalize text-primary">{name}</span>
          </h1>

          <p className="text-base text-muted-foreground">{subtitle}</p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <CreateQuizModalTrigger
              locale={locale}
              variant="primary"
              size="default"
              label={t(locale, "dashboard.createQuiz")}
              className="normal-case tracking-normal"
              icon={<Plus className="h-4 w-4" />}
            />
            <Link
              href="/dashboard/quizzes"
              className="text-base font-semibold text-blue uppercase transition-colors hover:text-blue/80 hover:underline"
            >
              {t(locale, "dashboard.home.ctaSeeMyQuizzes")}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[9rem] shrink-0 items-end justify-center sm:mx-0 sm:max-w-[11rem] md:max-w-[13rem]">
          <div
            className="absolute bottom-2 left-1/2 h-4 w-20 -translate-x-1/2 rounded-full bg-muted/80 blur-sm"
            aria-hidden
          />
          {!mascotError ? (
            <Image
              src="/mascotte.png"
              alt=""
              width={208}
              height={208}
              className="relative h-auto w-full animate-float object-contain drop-shadow-md"
              unoptimized
              onError={() => setMascotError(true)}
            />
          ) : (
            <div
              className="relative flex aspect-square w-full items-center justify-center rounded-3xl bg-primary/10 animate-float"
              aria-hidden
            >
              <Bird className="h-16 w-16 text-primary" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardWelcomeBannerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="space-y-4">
        <div className="h-8 w-56 max-w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-full max-w-sm animate-pulse rounded bg-muted/70" />
        <div className="flex gap-3">
          <div className="h-11 w-40 animate-pulse rounded-2xl bg-muted" />
          <div className="h-5 w-28 animate-pulse self-center rounded bg-muted/60" />
        </div>
      </div>
    </div>
  );
}
