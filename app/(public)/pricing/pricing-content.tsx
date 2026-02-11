"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AnimateOnScroll } from "@/components/animate-on-scroll";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { useSession } from "next-auth/react";
import { Coins, Sparkles, Check, Loader2, FileText, Users, BarChart3 } from "lucide-react";
import { createCheckoutSession } from "./actions";
import { useToast } from "@/components/ui/toast";

type CoinPack = {
  id: string;
  name: string;
  displayName: string;
  coins: number;
  price: number;
  stripePriceId: string | null;
  isActive: boolean;
  isPopular: boolean;
  order: number;
};

const COINS_USE_CASES: Array<{
  key: "coinsUseCaseGeneration" | "coinsUseCaseReport" | "coinsUseCaseParticipants" | "coinsUseCaseManual";
  icon: typeof Sparkles;
  coins: number;
  detailKey?: "coinsUseCaseReportDetail";
}> = [
  { key: "coinsUseCaseGeneration", icon: Sparkles, coins: 2 },
  { key: "coinsUseCaseReport", icon: BarChart3, coins: 4, detailKey: "coinsUseCaseReportDetail" },
  { key: "coinsUseCaseParticipants", icon: Users, coins: 0 },
  { key: "coinsUseCaseManual", icon: FileText, coins: 0 },
];

export function PricingContent({ initialPacks }: { initialPacks: CoinPack[] }) {
  const { locale } = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [packs, setPacks] = useState<CoinPack[]>(initialPacks);

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const response = await fetch("/api/coin-packs");
        if (response.ok) {
          const data = await response.json();
          setPacks(data.packs || []);
        }
      } catch (error) {
        console.error("[Pricing] Error fetching packs:", error);
      }
    };
    fetchPacks();
  }, []);

  const handlePurchase = async (packId: string) => {
    if (!session?.user) {
      router.push("/auth/signup?callbackUrl=" + encodeURIComponent("/pricing"));
      return;
    }

    setLoadingPackId(packId);
    try {
      const result = await createCheckoutSession(packId);
      if (result.success && result.url) {
        window.location.assign(result.url);
      } else {
        const message = "error" in result ? result.error : t(locale, "pricing.checkoutError");
        showToast(message, "error");
        setLoadingPackId(null);
      }
    } catch (error) {
      console.error("[Pricing] Error creating checkout:", error);
      showToast(t(locale, "pricing.checkoutError"), "error");
      setLoadingPackId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="container relative mx-auto px-4 py-16 md:py-24">
          <AnimateOnScroll>
            <div className="max-w-2xl mx-auto text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                {t(locale, "pricing.title")}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t(locale, "pricing.subtitle")}
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* What your coins get you */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <AnimateOnScroll>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
            {t(locale, "pricing.coinsUseCasesTitle")}
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            {t(locale, "pricing.coinsUseCasesSubtitle")}
          </p>
        </AnimateOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {COINS_USE_CASES.map(({ key, icon: Icon, coins, detailKey }, i) => (
            <AnimateOnScroll key={key} delay={100 + 80 * i}>
              <Card className="group relative flex flex-col rounded-2xl border-2 border-transparent bg-card shadow-(--shadow-neu-raised) hover:border-primary/20 hover:shadow-(--shadow-neu-primary) transition-all duration-300 h-full overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full transition-colors group-hover:bg-primary/10" />
                <CardContent className="relative pt-6 pb-6 px-6 flex flex-col items-center text-center gap-4 min-h-[180px]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                    <Icon className="h-7 w-7" strokeWidth={1.8} />
                  </div>
                  {coins > 0 ? (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline justify-center gap-1.5">
                        <span className="text-3xl font-bold tabular-nums">{coins}</span>
                        <Coins className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        {t(locale, "pricing.coinsPerUse")}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-sm font-semibold px-3 py-1">
                      {t(locale, "pricing.free")}
                    </Badge>
                  )}
                  <p className="text-sm font-semibold leading-snug mt-auto">
                    {t(locale, `pricing.${key}`)}
                  </p>
                  {detailKey && (
                    <p className="text-xs text-muted-foreground -mt-2">
                      {t(locale, `pricing.${detailKey}`)}
                    </p>
                  )}
                </CardContent>
              </Card>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Packs */}
      <section className="border-t border-border/50 bg-muted/30">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <AnimateOnScroll>
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
              {t(locale, "pricing.choosePack")}
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              {t(locale, "pricing.choosePackSubtitle")}
            </p>
          </AnimateOnScroll>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {packs.length === 0 ? (
              <div className="col-span-3 text-center py-16 rounded-2xl bg-card border border-border">
                <p className="text-muted-foreground">{t(locale, "pricing.noPacksAvailable")}</p>
              </div>
            ) : (
              packs.map((pack, index) => {
                const generations = Math.floor(pack.coins / 2);
                const isPopular = pack.isPopular;

                return (
                  <AnimateOnScroll key={pack.id} delay={120 * index}>
                    <Card
                      className={`relative flex flex-col rounded-2xl h-full overflow-hidden transition-all duration-300 ${
                        isPopular
                          ? "border-2 border-primary shadow-(--shadow-neu-primary) scale-[1.02] md:scale-105"
                          : "border-2 border-transparent shadow-(--shadow-neu-raised) hover:border-primary/20"
                      }`}
                    >
                      {isPopular && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                      )}
                      {isPopular && (
                        <Badge
                          className="absolute top-4 right-4 z-10"
                          variant="default"
                        >
                          {t(locale, "pricing.popular")}
                        </Badge>
                      )}
                      <CardHeader className="pb-4 pt-6">
                        <CardTitle className="text-xl font-bold">
                          {pack.displayName}
                        </CardTitle>
                        <CardDescription className="text-base">
                          {pack.coins} {t(locale, "pricing.coins")} {t(locale, "pricing.for")} {pack.price}€
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 space-y-6 pb-6">
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold tracking-tight">{pack.price}€</span>
                          <span className="text-muted-foreground">/ {t(locale, "pricing.oneTime")}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Coins className="h-5 w-5 text-primary" />
                          <span className="font-medium">{pack.coins} {t(locale, "pricing.coins")}</span>
                        </div>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-3 text-sm">
                            <Check className="h-5 w-5 text-primary shrink-0" />
                            <span>~{generations} {t(locale, "pricing.aiGenerations")}</span>
                          </li>
                          <li className="flex items-center gap-3 text-sm">
                            <Check className="h-5 w-5 text-primary shrink-0" />
                            <span>{t(locale, "pricing.unlimitedManual")}</span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter className="pt-0 pb-6">
                        <Button
                          variant={isPopular ? "primary" : "secondary"}
                          size="lg"
                          className="w-full rounded-xl h-12 text-base font-semibold"
                          disabled={loadingPackId !== null}
                          onClick={() => handlePurchase(pack.id)}
                        >
                          {loadingPackId === pack.id ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              {t(locale, "pricing.processing")}
                            </>
                          ) : (
                            t(locale, "pricing.purchase")
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </AnimateOnScroll>
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
