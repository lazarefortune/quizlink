"use client";

import { CheckCircle2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

export function WhyQuizLinkSection() {
  const { locale } = useLocale();

  const values = [
    {
      title: t(locale, "landing.whyQuizLink.noDisposable.title"),
      description: t(locale, "landing.whyQuizLink.noDisposable.description"),
    },
    {
      title: t(locale, "landing.whyQuizLink.realResults.title"),
      description: t(locale, "landing.whyQuizLink.realResults.description"),
    },
    {
      title: t(locale, "landing.whyQuizLink.humanTracking.title"),
      description: t(locale, "landing.whyQuizLink.humanTracking.description"),
    },
  ];

  return (
    <section className="py-16 px-4 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <AnimateOnScroll>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="h1 text-3xl font-bold sm:text-4xl md:text-5xl">
              {t(locale, "landing.whyQuizLink.title")}
              <BrandQuizLinkText className="inline" />
            </h2>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
              {t(locale, "landing.whyQuizLink.subtitle")}
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid gap-6 md:grid-cols-3">
          {values.map((value, index) => (
            <AnimateOnScroll key={index} delay={100 + 80 * index}>
              <Card className="flex flex-col">
              <CardHeader>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <CardTitle className="text-xl">{value.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <CardDescription className="text-base">
                  {value.description}
                </CardDescription>
              </CardContent>
            </Card>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
