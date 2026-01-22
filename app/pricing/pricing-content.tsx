"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { useSession } from "next-auth/react";
import { Coins, Sparkles, Check, Loader2 } from "lucide-react";
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

export function PricingContent({ initialPacks }: { initialPacks: CoinPack[] }) {
  const { locale } = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [packs, setPacks] = useState<CoinPack[]>(initialPacks);

  // Fetch packs on mount (in case they were updated)
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
      router.push("/auth/signin");
      return;
    }

    setLoadingPackId(packId);
    try {
      const result = await createCheckoutSession(packId);
      if (result.success) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else {
        showToast(result.error || t(locale, "pricing.checkoutError"), "error");
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
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-4 mb-12">
          <h1 className="text-3xl md:text-4xl font-bold">{t(locale, "pricing.title")}</h1>
          <p className="text-lg text-muted-foreground">{t(locale, "pricing.subtitle")}</p>
          <div className="flex items-center justify-center gap-2 mt-6 p-4 bg-muted rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-medium">{t(locale, "pricing.coinRule")}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {packs.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-muted-foreground">{t(locale, "pricing.noPacksAvailable")}</p>
            </div>
          ) : (
            packs.map((pack) => {
              const generations = Math.floor(pack.coins / 2); // ~2 coins per generation
              
              return (
                <Card
                  key={pack.id}
                  className={`relative flex flex-col ${pack.isPopular ? "border-primary shadow-lg" : ""}`}
                >
                  {pack.isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
                      {t(locale, "pricing.popular")}
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl">{pack.displayName}</CardTitle>
                    <CardDescription>
                      {pack.coins} {t(locale, "pricing.coins")} {t(locale, "pricing.for")} {pack.price}€
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold">{pack.price}€</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Coins className="h-4 w-4" />
                        <span>{pack.coins} {t(locale, "pricing.coins")}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        ~{generations} {t(locale, "pricing.generations")}
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{pack.coins} {t(locale, "pricing.coins")}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span>~{generations} {t(locale, "pricing.aiGenerations")}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-primary" />
                        <span>{t(locale, "pricing.unlimitedManual")}</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant={pack.isPopular ? "primary" : "secondary"}
                      className="w-full"
                      disabled={!session?.user || loadingPackId !== null}
                      onClick={() => handlePurchase(pack.id)}
                    >
                      {loadingPackId === pack.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {t(locale, "pricing.processing")}
                        </>
                      ) : (
                        t(locale, "pricing.purchase")
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
