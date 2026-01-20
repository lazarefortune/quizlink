"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { getUserCoinTransactions, type CoinTransaction } from "./actions";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";

export function CoinsContent() {
  const { locale } = useLocale();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTransactions() {
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
      } catch (err) {
        setError("Failed to load transactions");
        console.error("Error loading transactions:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTransactions();
  }, []);

  const dateLocale = locale === "fr" ? fr : enUS;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{t(locale, "account.coins.title")}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t(locale, "account.coins.subtitle")}
          </p>
        </div>

        {/* Current Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              {t(locale, "account.coins.currentBalance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold">{balance}</span>
              <span className="text-lg text-muted-foreground">
                {t(locale, "account.coins.coins")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transaction History Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "account.coins.transactionHistory")}</CardTitle>
            <CardDescription>
              {t(locale, "account.coins.transactionHistoryDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">{t(locale, "common.loading")}</p>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-destructive">{error}</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Coins className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">{t(locale, "account.coins.noTransactions")}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t(locale, "account.coins.date")}</TableHead>
                      <TableHead>{t(locale, "account.coins.amount")}</TableHead>
                      <TableHead>{t(locale, "account.coins.reason")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const isCredit = transaction.amount > 0;
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {format(new Date(transaction.createdAt), "PPp", { locale: dateLocale })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
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
                                {transaction.amount}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {transaction.reason}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
