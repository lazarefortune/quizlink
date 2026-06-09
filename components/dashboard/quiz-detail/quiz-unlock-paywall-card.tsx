"use client";

import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

type QuizUnlockPaywallCardProps = {
  totalResponses: number;
  visibleGamesCount: number;
  onUnlockClick: () => void;
};

export function QuizUnlockPaywallCard({
  totalResponses,
  visibleGamesCount,
  onUnlockClick,
}: QuizUnlockPaywallCardProps) {
  const { locale } = useLocale();

  return (
    <section
      data-testid="quiz-unlock-paywall"
      className="rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground">
            {t(locale, "dashboard.unlockDialog.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t(locale, "dashboard.unlockDialog.description", {
              total: String(totalResponses),
              visible: String(visibleGamesCount),
            })}
          </p>
        </div>
        <Button
          type="button"
          variant="blue"
          className="w-full shrink-0 gap-1.5 sm:w-auto"
          onClick={onUnlockClick}
        >
          <Lock className="h-4 w-4" aria-hidden />
          {t(locale, "dashboard.unlockDialog.unlockResponses")}
        </Button>
      </div>
    </section>
  );
}
