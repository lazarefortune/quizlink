"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { useSession } from "next-auth/react";
import { Coins, Sparkles, Check, Loader2 } from "lucide-react";
import { createCheckoutSession } from "./actions";
import { useToast } from "@/components/ui/toast";

const OFFERS = [
  {
    id: "STARTER",
    nameKey: "pricing.starter.name",
    price: 5,
    coins: 50,
    generations: 25,
    popular: false,
  },
  {
    id: "BOOST",
    nameKey: "pricing.boost.name",
    price: 10,
    coins: 120,
    generations: 60,
    popular: true,
  },
  {
    id: "PRO",
    nameKey: "pricing.pro.name",
    price: 20,
    coins: 300,
    generations: 150,
    popular: false,
  },
] as const;

export function PricingContent() {
  const { locale } = useLocale();
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);

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
          {OFFERS.map((offer) => (
            <Card
              key={offer.id}
              className={`relative flex flex-col ${offer.popular ? "border-primary shadow-lg" : ""}`}
            >
              {offer.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2" variant="default">
                  {t(locale, "pricing.popular")}
                </Badge>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{t(locale, offer.nameKey)}</CardTitle>
                <CardDescription>{t(locale, `pricing.${offer.id}.description`)}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{offer.price}€</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Coins className="h-4 w-4" />
                    <span>{offer.coins} {t(locale, "pricing.coins")}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ~{offer.generations} {t(locale, "pricing.generations")}
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{offer.coins} {t(locale, "pricing.coins")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>~{offer.generations} {t(locale, "pricing.aiGenerations")}</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{t(locale, "pricing.unlimitedManual")}</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  variant={offer.popular ? "primary" : "secondary"}
                  className="w-full"
                  disabled={!session?.user || loadingPackId !== null}
                  onClick={() => handlePurchase(offer.id)}
                >
                  {loadingPackId === offer.id ? (
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
          ))}
        </div>

        <div className="max-w-2xl mx-auto text-center space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">{t(locale, "pricing.paymentNote")}</p>
              {!session?.user && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/auth/signup">
                    <Button variant="primary">{t(locale, "auth.signUp.button")}</Button>
                  </Link>
                  <Link href="/auth/signin">
                    <Button variant="secondary">{t(locale, "auth.signIn.button")}</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
