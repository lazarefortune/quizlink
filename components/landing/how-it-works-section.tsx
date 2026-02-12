"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { FileText, Share2, BarChart3 } from "lucide-react";

export function HowItWorksSection() {
  const { locale } = useLocale();

  const steps = [
    {
      icon: FileText,
      title: t(locale, "landing.howItWorks.step1.title"),
      description: t(locale, "landing.howItWorks.step1.description"),
    },
    {
      icon: Share2,
      title: t(locale, "landing.howItWorks.step2.title"),
      description: t(locale, "landing.howItWorks.step2.description"),
    },
    {
      icon: BarChart3,
      title: t(locale, "landing.howItWorks.step3.title"),
      description: t(locale, "landing.howItWorks.step3.description"),
    },
  ];

  return (
    <section className="py-16 px-4 sm:py-20 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        <AnimateOnScroll>
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="h1 text-3xl font-bold sm:text-4xl md:text-5xl">
              {t(locale, "landing.howItWorks.title")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
              {t(locale, "landing.howItWorks.subtitle")}
            </p>
          </div>
        </AnimateOnScroll>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <AnimateOnScroll key={index} delay={100 + 80 * index}>
                <Card className="relative">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-muted-foreground">
                      {t(locale, "landing.howItWorks.step")} {index + 1}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {step.description}
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
