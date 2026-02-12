"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { GraduationCap, ClipboardCheck, BookOpen, Brain } from "lucide-react";

export function UseCasesSection() {
  const { locale } = useLocale();

  const useCases = [
    {
      icon: GraduationCap,
      title: t(locale, "landing.useCases.training.title"),
      description: t(locale, "landing.useCases.training.description"),
    },
    {
      icon: ClipboardCheck,
      title: t(locale, "landing.useCases.evaluation.title"),
      description: t(locale, "landing.useCases.evaluation.description"),
    },
    {
      icon: BookOpen,
      title: t(locale, "landing.useCases.revision.title"),
      description: t(locale, "landing.useCases.revision.description"),
    },
    {
      icon: Brain,
      title: t(locale, "landing.useCases.knowledge.title"),
      description: t(locale, "landing.useCases.knowledge.description"),
    },
  ];

  return (
    <section className="py-16 px-4 sm:py-20 md:py-24">
      <div className="mx-auto max-w-6xl">
        <AnimateOnScroll>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="h1 text-3xl font-bold sm:text-4xl md:text-5xl">
              {t(locale, "landing.useCases.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
              {t(locale, "landing.useCases.subtitle")}
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <AnimateOnScroll key={index} delay={100 + 80 * index}>
                <Card className="flex flex-col">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{useCase.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="text-base">
                    {useCase.description}
                  </CardDescription>
                </CardContent>
              </Card>
              </AnimateOnScroll>
            );
          })}
        </div>
      </div>
    </section>
  );
}
