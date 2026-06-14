"use client";

import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { Loader2 } from "lucide-react";

import { ManageProSubscriptionButton } from "@/app/(app)/account/manage-pro-subscription-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ActiveUserSubscriptionAccess } from "@/lib/quiz/getActiveUserSubscriptionAccess";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import {
  COINS_PAGE_PRO_BENEFIT_KEYS,
  PRO_MONTHLY_INCLUDED_COINS,
  PRO_MONTHLY_PRICE_EUR,
} from "@/lib/subscription/proSubscriptionConstants";

import { ProBenefitIcon } from "./coins-pro-benefit-icons";
import { CoinsProCrownIcon } from "./coins-pro-crown-icon";

type CoinsProSubscriptionCardProps = {
  proAccess: ActiveUserSubscriptionAccess;
  isProAvailable: boolean;
  isStartingProCheckout: boolean;
  onStartProCheckout: () => void;
};

function ProBenefitList({ isUpsell }: { isUpsell: boolean }) {
  const { locale } = useLocale();

  return (
    <ul className="space-y-2">
      {COINS_PAGE_PRO_BENEFIT_KEYS.map((key) => (
        <li
          key={key}
          className={cnBenefitItem(isUpsell)}
        >
          <ProBenefitIcon benefitKey={key} />
          <span className="text-base sm:text-lg">
            {t(
              locale,
              key,
              key === "account.subscription.monthlyCoinsIncluded"
                ? { coins: PRO_MONTHLY_INCLUDED_COINS }
                : undefined,
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function cnBenefitItem(isUpsell: boolean) {
  return isUpsell
    ? "flex items-center gap-2.5 text-sm font-medium text-white/90"
    : "flex items-center gap-2.5 text-sm text-foreground";
}

export function CoinsProSubscriptionCard({
  proAccess,
  isProAvailable,
  isStartingProCheckout,
  onStartProCheckout,
}: CoinsProSubscriptionCardProps) {
  const { locale } = useLocale();
  const dateLocale = locale === "fr" ? fr : enUS;
  const isUpsell = !proAccess.isActive;

  return (
    <Card
      variant={isUpsell ? undefined : "playful"}
      className={
        isUpsell
          ? "relative overflow-visible rounded-3xl border-[3px] border-[hsl(199_55%_32%)] bg-gradient-to-br from-[hsl(199_65%_26%)] via-[hsl(199_70%_22%)] to-[hsl(199_75%_17%)] shadow-[0_6px_0_hsl(var(--blue-shadow)),0_12px_32px_hsl(199_70%_12%/0.45)] dark:border-[hsl(199_50%_36%)] dark:from-[hsl(199_55%_22%)] dark:via-[hsl(199_60%_18%)] dark:to-[hsl(199_65%_14%)] dark:shadow-[0_6px_0_hsl(var(--blue-shadow)),0_12px_32px_rgba(0,0,0,0.45)]"
          : "relative overflow-visible border-2 border-border bg-card shadow ring-2 ring-border"
      }
      data-testid="coins-pro-subscription-card"
    >
      {isUpsell ? (
        <CoinsProCrownIcon className="pointer-events-none absolute -right-4 -top-8 z-10 h-24 w-24 rotate-12 drop-shadow-[0_4px_8px_rgba(0,0,0,0.35)] sm:-right-5 sm:-top-9 sm:h-28 sm:w-28" />
      ) : null}

      <CardContent className="relative p-5 sm:p-6">
        {isUpsell ? (
          <div className="flex flex-col gap-5">
            <div className="space-y-4 pr-16 sm:pr-20">
              <h2 className="font-fredoka text-xl font-bold tracking-tight text-white sm:text-2xl">
                {t(locale, "account.subscription.proTitle")}
              </h2>

              <div className="flex items-baseline gap-1.5">
                <span className="font-fredoka text-4xl font-black tabular-nums text-white sm:text-5xl">
                  {PRO_MONTHLY_PRICE_EUR}€
                </span>
                <span className="text-base font-semibold text-white/70">
                  {t(locale, "account.subscription.perMonth")}
                </span>
              </div>

              <ProBenefitList isUpsell />
            </div>

            <Button
              type="button"
              variant="white"
              size="lg"
              className="h-13 w-full font-fredoka text-base font-bold normal-case tracking-normal"
              disabled={!isProAvailable || isStartingProCheckout}
              onClick={onStartProCheckout}
            >
              {isStartingProCheckout ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : null}
              {t(locale, "account.subscription.upgradeToPro")}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground sm:text-xl">
                  {t(locale, "account.subscription.proTitle")}
                </h2>
                <Badge
                  variant="default"
                  className="font-semibold"
                  data-testid="coins-pro-active-badge"
                >
                  {t(locale, "account.subscription.activeBadge")}
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-muted-foreground">
                {proAccess.currentPeriodEnd ? (
                  <p>
                    {t(locale, "account.subscription.renewalDate", {
                      date: format(proAccess.currentPeriodEnd, "PP", {
                        locale: dateLocale,
                      }),
                    })}
                  </p>
                ) : null}
              </div>

              <ProBenefitList isUpsell={false} />
            </div>

            <div className="flex shrink-0 flex-col gap-2 lg:pt-1">
              <ManageProSubscriptionButton variant="outline" className="w-full lg:w-auto" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
