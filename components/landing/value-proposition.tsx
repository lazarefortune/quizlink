"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles, Share2, Settings } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

export function ValueProposition() {
  const { locale } = useLocale();

  return (
    <section className="py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="h1 text-3xl font-bold sm:text-4xl">
            {t(locale, "landing.value.title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t(locale, "landing.value.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Sparkles className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>{t(locale, "landing.value.manualOrAi.title")}</CardTitle>
              <CardDescription>
                {t(locale, "landing.value.manualOrAi.description")}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Share2 className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>{t(locale, "landing.value.shareEasily.title")}</CardTitle>
              <CardDescription>
                {t(locale, "landing.value.shareEasily.description")}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Settings className="mb-2 h-8 w-8 text-primary" />
              <CardTitle>{t(locale, "landing.value.fullCustomization.title")}</CardTitle>
              <CardDescription>
                {t(locale, "landing.value.fullCustomization.description")}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </section>
  );
}
