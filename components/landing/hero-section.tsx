"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { ArrowRight, Sparkles } from "lucide-react";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HeroSection() {
  const { locale } = useLocale();

  const titleWithHighlights = useMemo(() => {
    const title = t(locale, "landing.hero.title");
    const highlightsStr = t(locale, "landing.hero.titleHighlights");
    if (!highlightsStr || highlightsStr === "landing.hero.titleHighlights") {
      return [title];
    }
    const keywords = highlightsStr.split(",").map((w) => w.trim()).filter(Boolean);
    if (keywords.length === 0) return [title];
    const pattern = new RegExp(`(${keywords.map(escapeRegex).join("|")})`, "gi");
    const segments = title.split(pattern);
    return segments.map((seg) => {
      const isKeyword = keywords.some((k) => k.toLowerCase() === seg.toLowerCase());
      return isKeyword ? { type: "highlight" as const, text: seg } : { type: "normal" as const, text: seg };
    });
  }, [locale]);

  return (
    <section className="relative overflow-hidden py-24 px-4 sm:py-32 md:py-40 lg:py-48 bg-background">
      {/* Dot Grid Background Pattern */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(128, 128, 128, 0.3) 1.5px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="text-center space-y-10 sm:space-y-12">
          <AnimateOnScroll>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
                <span className="block">
                  {titleWithHighlights.map((part, i) =>
                    part.type === "highlight" ? (
                      <span key={i} className="text-primary font-semibold">
                        {part.text}
                      </span>
                    ) : (
                      <span key={i}>{part.text}</span>
                    )
                  )}
                </span>
              </h1>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll delay={80}>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl md:text-2xl">
              {t(locale, "landing.hero.subtitle")}
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll delay={160}>
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
          </AnimateOnScroll>
        </div>
      </div>
    </section>
  );
}
