"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { CheckCircle2, Lock } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

export function UpgradeTeaser() {
  const { locale } = useLocale();

  return (
    <section className="py-16 px-4">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <CardTitle>{t(locale, "landing.upgrade.title")}</CardTitle>
            </div>
            <CardDescription>
              {t(locale, "landing.upgrade.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="info" title={t(locale, "landing.upgrade.currentLimitations")}>
              {t(locale, "landing.upgrade.limitationsText")}
            </Alert>

            <div>
              <h3 className="mb-4 text-lg font-semibold">
                {t(locale, "landing.upgrade.unlockTitle")}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium">{t(locale, "landing.upgrade.moreQuestions.title")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(locale, "landing.upgrade.moreQuestions.description")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium">{t(locale, "landing.upgrade.fileUpload.title")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(locale, "landing.upgrade.fileUpload.description")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium">{t(locale, "landing.upgrade.fullAi.title")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(locale, "landing.upgrade.fullAi.description")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium">{t(locale, "landing.upgrade.advancedOptions.title")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t(locale, "landing.upgrade.advancedOptions.description")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                {t(locale, "landing.upgrade.upgradeLater")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
