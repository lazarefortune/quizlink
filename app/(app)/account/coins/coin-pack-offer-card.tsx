"use client";

import { Check, Loader2, ZapIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveCoinPackBenefitCounts } from "@/lib/coins/coinPackBenefits";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

import { CoinPackCoinsIcon } from "./coin-pack-coins-icon";

export type CoinPackOffer = {
  id: string;
  displayName: string;
  coins: number;
  price: number;
  isPopular: boolean;
};

type CoinPackOfferCardProps = {
  pack: CoinPackOffer;
  isLoading: boolean;
  isAnyPackLoading: boolean;
  onPurchase: (packId: string) => void;
};

function CoinPackBenefitCheck() {
  return (
    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue text-blue-foreground shadow-[0_2px_0_hsl(var(--blue-shadow))]">
      <Check className="h-3 w-3 shrink-0 text-white" aria-hidden />
    </div>
  );
}

function CoinPackPopularBadge() {
  const { locale } = useLocale();

  return (
    <span
      className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 -rotate-2 rounded-xl border-2 border-[hsl(35_100%_35%)] bg-highlight px-4 py-1 font-fredoka text-xs font-black uppercase tracking-wide text-highlight-foreground shadow-[0_3px_0_hsl(35_100%_35%)] sm:text-sm"
      data-testid="coin-pack-popular-badge"
    >
      {t(locale, "account.coins.popularBadge")}
    </span>
  );
}

export function CoinPackOfferCard({
  pack,
  isLoading,
  isAnyPackLoading,
  onPurchase,
}: CoinPackOfferCardProps) {
  const { locale } = useLocale();
  const { aiGenerations, quizUnlocks } = resolveCoinPackBenefitCounts(pack.coins);

  return (
    <Card
      variant="playful"
      className={`relative overflow-visible ${
        pack.isPopular
          ? "border-highlight/60 ring-2 ring-highlight/25"
          : "hover:border-blue/30"
      }`}
      data-testid={`coin-pack-offer-card-${pack.id}`}
    >
      {pack.isPopular ? <CoinPackPopularBadge /> : null}

      <CardContent className="space-y-4 p-5 sm:p-6">
        <p className="font-fredoka text-sm font-bold uppercase tracking-wide text-muted-foreground">
          {pack.displayName}
        </p>

        <div className="flex items-center gap-3">
          <CoinPackCoinsIcon
            coins={pack.coins}
            className="h-16 w-16 shrink-0 sm:h-[4.25rem] sm:w-[4.25rem]"
          />
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-fredoka text-3xl font-black tabular-nums leading-none text-foreground sm:text-4xl">
                {pack.coins}
              </span>
              <span className="font-fredoka text-base font-bold text-muted-foreground sm:text-lg">
                {t(locale, "account.coins.coins")}
              </span>
            </div>
            <p className="mt-0.5 font-fredoka text-base font-semibold text-muted-foreground/80">
              {pack.price}€
            </p>
          </div>
        </div>

        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CoinPackBenefitCheck />
            <span>
              {t(locale, "account.coins.packBenefitAiGenerations", {
                count: aiGenerations,
              })}
            </span>
          </li>
          <li className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CoinPackBenefitCheck />
            <span>
              {t(locale, "account.coins.packBenefitQuizUnlocks", {
                count: quizUnlocks,
              })}
            </span>
          </li>
        </ul>

        <Button
          variant={pack.isPopular ? "blue" : "secondary"}
          className="w-full font-fredoka font-bold normal-case tracking-normal"
          disabled={isAnyPackLoading}
          onClick={() => onPurchase(pack.id)}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {t(locale, "pricing.loading")}
            </>
          ) : (
            <>
              <ZapIcon className="h-4 w-4" aria-hidden />
              {t(locale, "pricing.purchase")}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
