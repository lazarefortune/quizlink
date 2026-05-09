"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { track } from "@/lib/analytics/track";
import { PRICING_VIEWED, CHECKOUT_STARTED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Coins,
  ArrowUpCircle,
  ArrowDownCircle,
  ShoppingBag,
  Check,
  Loader2,
  Zap,
  History,
  FileText,
  ZapIcon,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import {
  getUserCoinTransactions,
  createCheckoutSession,
  type CoinTransaction,
} from "./actions";
import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

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

export function CoinsContent() {
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packs, setPacks] = useState<CoinPack[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getUserCoinTransactions();
        if (result.success) {
          setTransactions(result.transactions);
          setBalance(result.balance);
        } else {
          setError(result.error);
        }
      } catch {
        setError("Failed to load transactions");
      } finally {
        setIsLoading(false);
      }
    }

    async function loadPacks() {
      setIsLoadingPacks(true);
      try {
        const response = await fetch("/api/coin-packs");
        if (response.ok) {
          const data = await response.json();
          setPacks(data.packs || []);
        }
      } catch {
        // Silently fail
      } finally {
        setIsLoadingPacks(false);
      }
    }

    loadData();
    loadPacks();
  }, []);

  useEffect(() => {
    track(PRICING_VIEWED, {
      ...buildCommonEventProps({
        page: "pricing",
        isLoggedIn: true,
        preferredLanguage: locale,
      }),
      page: "pricing",
    });
  }, [locale]);

  const handlePurchase = async (packId: string) => {
    const pack = packs.find((p) => p.id === packId);
    track(CHECKOUT_STARTED, {
      ...buildCommonEventProps({
        page: "pricing",
        isLoggedIn: true,
        preferredLanguage: locale,
      }),
      pack_id: packId,
      price: pack?.price,
      currency: "eur",
    });
    setLoadingPackId(packId);
    try {
      const result = await createCheckoutSession(packId);
      if (result.success && result.url) {
        window.location.assign(result.url);
      } else {
        const message =
          "error" in result ? result.error : t(locale, "pricing.checkoutError");
        showToast(message, "error");
        setLoadingPackId(null);
      }
    } catch {
      showToast(t(locale, "pricing.checkoutError"), "error");
      setLoadingPackId(null);
    }
  };

  const dateLocale = locale === "fr" ? fr : enUS;
  const isLowBalance = balance < 4;

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8 sm:space-y-10">
        {/* Hero: titre boutique */}
        <div>
          <h1 className="h1 text-2xl font-black tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {t(locale, "account.coins.title")}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {t(locale, "account.coins.subtitle")}
          </p>
        </div>

        {/* Balance + actions */}
        <Card className="overflow-hidden border-2">
          <CardContent className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue/15 text-blue">
                <Coins className="h-7 w-7" />
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  {t(locale, "account.coins.currentBalance")}
                </p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-4xl font-black tabular-nums text-foreground">
                    {isLoading ? "–" : balance}
                  </span>
                  <span className="text-lg font-semibold text-muted-foreground">
                    {t(locale, "account.coins.coins")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="secondary"
                size="default"
                className="gap-2 font-semibold"
                onClick={() => setHistoryModalOpen(true)}
              >
                <History className="h-4 w-4" />
                {t(locale, "account.coins.history")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Low balance alert */}
        {!isLoading && isLowBalance && (
          <div className="flex items-center gap-3 rounded-xl border-2 border-warning/30 bg-warning/5 p-4">
            <Zap className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm font-medium">
              {t(locale, "account.coins.lowBalanceMessage")}
            </p>
          </div>
        )}

        {/* Nos offres — extensible pour d'autres produits plus tard */}
        <section id="shop-offers" className="scroll-mt-8 space-y-6">
          <h2 className="h2 text-xl font-black text-foreground sm:text-2xl">
            {t(locale, "account.coins.ourOffers")}
          </h2>

          {isLoadingPacks ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-8 bg-muted rounded w-1/3" />
                    <div className="h-10 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : packs.length === 0 ? (
            <Card variant="playful" className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">
                  {t(locale, "pricing.noPacksAvailable")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {packs.map((pack) => {
                const isPopular = pack.isPopular;
                return (
                  <Card
                    key={pack.id}
                    variant="playful"
                    className={`relative transition-all duration-200 ${
                      isPopular
                        ? "border-primary shadow-md ring-2 ring-primary/20"
                        : "hover:border-primary/30 hover:shadow-md"
                    }`}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 font-bold">
                        {t(locale, "pricing.popular")}
                      </Badge>
                    )}
                    <CardContent className="p-5 sm:p-6 space-y-4">
                      <div>
                        <p className="font-fredoka font-black text-foreground text-lg uppercase">
                          {pack.displayName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Coins className="h-5 w-5 text-primary" />
                          <span className="text-base font-fredoka font-semibold text-muted-foreground">
                            {pack.coins} {t(locale, "account.coins.coins")}
                          </span>
                        </div>
                      </div>
                      <p className="font-fredoka text-3xl font-black text-foreground">
                        {pack.price}€
                      </p>
                      <ul className="space-y-1.5 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          ~{Math.floor(pack.coins / 2)}{" "}
                          {t(locale, "pricing.aiGenerations")}
                        </li>
                        <li className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0" />
                          {t(locale, "pricing.unlimitedManual")}
                        </li>
                      </ul>
                      <Button
                        variant={isPopular ? "primary" : "secondary"}
                        className="w-full font-bold"
                        disabled={loadingPackId !== null}
                        onClick={() => handlePurchase(pack.id)}
                      >
                        {loadingPackId === pack.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {t(locale, "pricing.loading")}
                          </>
                        ) : (
                          <>
                            <ZapIcon
                              className="h-4 w-4"
                            />
                            {t(locale, "pricing.purchase")}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Factures — placeholder pour intégration future */}
        <section className="space-y-4">
          <h2 className="h2 text-xl font-black text-foreground sm:text-2xl">
            {t(locale, "account.coins.invoices")}
          </h2>
          <Card variant="playful" className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="font-semibold text-muted-foreground">
                {t(locale, "account.coins.invoicesComingSoon")}
              </p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {t(locale, "account.coins.invoicesDescription")}
              </p>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Modale Historique */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">
              {t(locale, "account.coins.historyDescription")}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0 -mx-6 px-6">
            {isLoading ? (
              <p className="text-muted-foreground font-medium py-4">
                {t(locale, "common.loading")}
              </p>
            ) : error ? (
              <p className="text-destructive font-medium py-4">{error}</p>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <History className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground font-medium">
                  {t(locale, "account.coins.noTransactions")}
                </p>
              </div>
            ) : (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-semibold">
                          {t(locale, "account.coins.date")}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t(locale, "account.coins.amount")}
                        </TableHead>
                        <TableHead className="font-semibold">
                          {t(locale, "account.coins.reason")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => {
                        const isCredit = tx.amount > 0;
                        return (
                          <TableRow key={tx.id}>
                            <TableCell className="whitespace-nowrap text-sm">
                              {format(new Date(tx.createdAt), "PPp", {
                                locale: dateLocale,
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {isCredit ? (
                                  <ArrowUpCircle className="h-4 w-4 text-green-500 dark:text-green-400" />
                                ) : (
                                  <ArrowDownCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
                                )}
                                <Badge
                                  variant={
                                    isCredit ? "default" : "destructive"
                                  }
                                  className="font-mono font-bold"
                                >
                                  {isCredit ? "+" : ""}
                                  {tx.amount}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {tx.reason}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="space-y-3 sm:hidden">
                  {transactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <Card key={tx.id}>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.createdAt), "PPp", {
                                locale: dateLocale,
                              })}
                            </p>
                            <div className="flex items-center gap-1.5">
                              {isCredit ? (
                                <ArrowUpCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                              )}
                              <Badge
                                variant={
                                  isCredit ? "default" : "destructive"
                                }
                                className="font-mono font-bold"
                              >
                                {isCredit ? "+" : ""}
                                {tx.amount}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm font-medium">{tx.reason}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
