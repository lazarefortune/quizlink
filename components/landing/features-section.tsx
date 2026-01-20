"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import {
  FileEdit,
  Sparkles,
  Link2,
  Users,
  BarChart3,
  Lock,
} from "lucide-react";

export function FeaturesSection() {
  const { locale } = useLocale();

  const features = [
    {
      icon: FileEdit,
      title: t(locale, "landing.features.manual.title"),
      description: t(locale, "landing.features.manual.description"),
    },
    {
      icon: Sparkles,
      title: t(locale, "landing.features.ai.title"),
      description: t(locale, "landing.features.ai.description"),
    },
    {
      icon: Link2,
      title: t(locale, "landing.features.shareable.title"),
      description: t(locale, "landing.features.shareable.description"),
    },
    {
      icon: Users,
      title: t(locale, "landing.features.participants.title"),
      description: t(locale, "landing.features.participants.description"),
    },
    {
      icon: BarChart3,
      title: t(locale, "landing.features.statistics.title"),
      description: t(locale, "landing.features.statistics.description"),
    },
    {
      icon: Lock,
      title: t(locale, "landing.features.security.title"),
      description: t(locale, "landing.features.security.description"),
    },
  ];

  return (
    <section className="py-16 px-4 sm:py-20 md:py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">
            {t(locale, "landing.features.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
            {t(locale, "landing.features.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="flex flex-col">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
