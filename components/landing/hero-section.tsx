"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  const { locale } = useLocale();

  return (
    <section className="relative overflow-hidden py-24 px-4 sm:py-32 md:py-40 lg:py-48 bg-background">
      {/* Dot Grid Background Pattern */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(128, 128, 128, 0.3) 1.5px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="text-center space-y-10 sm:space-y-12">
          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
              <span className="block bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                {t(locale, "landing.hero.title")}
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl md:text-2xl">
            {t(locale, "landing.hero.subtitle")}
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row sm:gap-4">
            <Link href="/builder/preview">
              <Button
                variant="primary"
                size="lg"
                className="group h-12 w-full px-8 text-base font-semibold sm:w-auto shadow-lg hover:shadow-xl transition-all"
              >
                {t(locale, "landing.hero.createButton")}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/generate/preview">
              <Button
                variant="secondary"
                size="lg"
                className="h-12 w-full px-8 text-base font-semibold sm:w-auto border-2 hover:bg-accent/50 transition-all"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                {t(locale, "landing.hero.generateButton")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
