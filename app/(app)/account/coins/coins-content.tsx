"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Coins,
  ArrowUpCircle,
  ArrowDownCircle,
  Sparkles,
  ShoppingBag,
  Check,
  Loader2,
  Zap,
  ArrowLeft,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { getUserCoinTransactions, createCheckoutSession, type CoinTransaction } from "./actions";
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
  const router = useRouter();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [packs, setPacks] = useState<CoinPack[]>([]);
  const [isLoadingPacks, setIsLoadingPacks] = useState(true);
  const [loadingPackId, setLoadingPackId] = useState<string | null>(null);

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
        // Silently fail — packs just won't show
      } finally {
        setIsLoadingPacks(false);
      }
    }

    loadData();
    loadPacks();
  }, []);

  const handlePurchase = async (packId: string) => {
    setLoadingPackId(packId);
    try {
      const result = await createCheckoutSession(packId);
      if (result.success && result.url) {
        window.location.assign(result.url);
      } else {
        const message =
          "error" in result
            ? result.error
            : t(locale, "pricing.checkoutError");
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
      <div className="mx-auto max-w-3xl space-y-8">
        {/* Back + Title */}
        <div>
          <h1 className="h1 text-2xl sm:text-3xl font-bold">
            {t(locale, "account.coins.title")}
          </h1>
        </div>

        {/* Balance card */}
        <Card className="overflow-hidden">
          <div className="relative">
            <div className="absolute inset-0" />
            <CardContent className="relative flex flex-col sm:flex-row items-center justify-between gap-4 p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue/15 text-blue">
                  <Coins className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm uppercase text-muted-foreground font-medium">
                    {t(locale, "account.coins.currentBalance")}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tabular-nums">
                      {isLoading ? "–" : balance}
                    </span>
                    <span className="text-lg text-muted-foreground">
                      {t(locale, "account.coins.coins")}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="blue"
                size="lg"
                className="w-full sm:w-auto shrink-0"
                onClick={() => {
                  document
                    .getElementById("shop-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <ShoppingBag className="h-4 w-4" />
                {locale === "fr" ? "Recharger" : "Top up"}
              </Button>
            </CardContent>
          </div>
        </Card>

        {/* Low balance alert */}
        {!isLoading && isLowBalance && (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-warning/5 p-4">
            <Zap className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm">
              {t(locale, "account.coins.lowBalanceMessage")}
            </p>
          </div>
        )}

        {/* Shop section */}
        <div id="shop-section" className="space-y-4 scroll-mt-8">
          <div>
            <h2 className="h1 text-xl font-semibold flex items-center gap-2">
              {t(locale, "account.coins.shopTitle")}
            </h2>
          </div>

          {isLoadingPacks ? (
            <div className="flex sm:grid sm:grid-cols-3 gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse shrink-0 w-[min(85vw,280px)] sm:w-auto">
                  <CardContent className="p-6 space-y-4">
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-8 bg-muted rounded w-1/3" />
                    <div className="h-10 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : packs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <ShoppingBag className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground text-sm">
                  {t(locale, "pricing.noPacksAvailable")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex sm:grid sm:grid-cols-3 gap-4 overflow-x-auto pb-2 sm:overflow-visible sm:pb-0 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {packs.map((pack) => {
                const isPopular = pack.isPopular;
                return (
                  <Card
                    key={pack.id}
                    className={`relative transition-all duration-200 shrink-0 w-[min(85vw,280px)] sm:w-auto snap-center ${
                      isPopular
                        ? "border-primary shadow-md ring-1 ring-primary/20"
                        : "hover:border-primary/30 hover:shadow-sm"
                    }`}
                  >
                    {isPopular && (
                      <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-10">
                        {t(locale, "pricing.popular")}
                      </Badge>
                    )}
                    <CardContent className="p-5 space-y-4">
                      <div>
                        <p className="h1 font-semibold text-base">
                          {pack.displayName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Coins className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {pack.coins} {t(locale, "account.coins.coins")}
                          </span>
                        </div>
                      </div>
                      <p className="text-3xl font-bold">{pack.price}€</p>
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
                        variant={isPopular ? "blue" : "secondary"}
                        className="w-full"
                        disabled={loadingPackId !== null}
                        onClick={() => handlePurchase(pack.id)}
                      >
                        {loadingPackId === pack.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            {t(locale, "pricing.loading")}
                          </>
                        ) : (
                          t(locale, "pricing.recharge")
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Transaction History */}
        <div className="space-y-4">
          <div>
            <h2 className="h1 text-xl font-semibold">
              {t(locale, "account.coins.transactionHistory")}
            </h2>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground h1">
                  {t(locale, "common.loading")}
                </p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-destructive h1">{error}</p>
              </CardContent>
            </Card>
          ) : transactions.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Coins className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground h1 text-sm">
                  {t(locale, "account.coins.noTransactions")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Desktop table */}
              <Card className="hidden sm:block">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>
                          {t(locale, "account.coins.date")}
                        </TableHead>
                        <TableHead>
                          {t(locale, "account.coins.amount")}
                        </TableHead>
                        <TableHead>
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
                                  variant={isCredit ? "default" : "destructive"}
                                  className="font-mono text-white dark:text-white"
                                >
                                  {isCredit ? "+" : ""}
                                  {tx.amount}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {tx.reason}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>

              {/* Mobile cards */}
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
                              variant={isCredit ? "default" : "destructive"}
                              className="font-mono"
                            >
                              {isCredit ? "+" : ""}
                              {tx.amount}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm">{tx.reason}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
