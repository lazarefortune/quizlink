"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { searchUserByEmail, getUserCoinTransactions, creditCoinsAction } from "./actions";
import { Coins, Search, Plus, ArrowUpCircle, ArrowDownCircle, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import Link from "next/link";

type User = {
  id: string;
  email: string;
  name: string;
  coinBalance: number;
};

type Transaction = {
  id: string;
  amount: number;
  reason: string;
  createdAt: Date;
};

export function AdminCoinsContent() {
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [searchEmail, setSearchEmail] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isCrediting, setIsCrediting] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const dateLocale = locale === "fr" ? fr : enUS;

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      showToast(t(locale, "admin.coins.emailRequired"), "error");
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchUserByEmail(searchEmail.trim());
      if (result.success) {
        setSelectedUser(result.user);
        setCoinAmount("");
        setReason("");
        loadTransactions(result.user.id);
      } else {
        const errorResult = result as { success: false; error: string };
        showToast(
          errorResult.error || t(locale, "admin.coins.userNotFound"),
          "error"
        );
        setSelectedUser(null);
        setTransactions([]);
      }
    } catch {
      showToast(t(locale, "common.error"), "error");
    } finally {
      setIsSearching(false);
    }
  };

  const loadTransactions = async (userId: string) => {
    setIsLoadingTransactions(true);
    try {
      const result = await getUserCoinTransactions(userId);
      if (result.success && result.transactions) {
        setTransactions(result.transactions);
      }
    } catch {
      // Silent
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const handleCreditCoins = async () => {
    if (!selectedUser) return;

    const amount = parseInt(coinAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast(t(locale, "admin.coins.invalidAmount"), "error");
      return;
    }

    if (!reason.trim()) {
      showToast(t(locale, "admin.coins.reasonRequired"), "error");
      return;
    }

    setIsCrediting(true);
    try {
      const result = await creditCoinsAction(
        selectedUser.id,
        amount,
        reason.trim()
      );
      if (result.success) {
        showToast(
          t(locale, "admin.coins.coinsCredited", {
            amount,
            name: selectedUser.name,
          }),
          "success"
        );
        setCoinAmount("");
        setReason("");
        const userResult = await searchUserByEmail(selectedUser.email);
        if (userResult.success && userResult.user) {
          setSelectedUser(userResult.user);
        }
        loadTransactions(selectedUser.id);
      } else {
        showToast(
          result.error || t(locale, "admin.coins.creditError"),
          "error"
        );
      }
    } catch {
      showToast(t(locale, "common.error"), "error");
    } finally {
      setIsCrediting(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href="/admin" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {locale === "fr" ? "Dashboard admin" : "Admin dashboard"}
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {t(locale, "admin.coins.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t(locale, "admin.coins.description")}
          </p>
        </div>

        {/* Search User */}
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="email@example.com"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching}
            variant="secondary"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isSearching
                ? t(locale, "common.loading")
                : t(locale, "common.search")}
            </span>
          </Button>
        </div>

        {/* User Info + Credit */}
        {selectedUser && (
          <Card>
            <CardContent className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t(locale, "auth.name")}
                  </p>
                  <p className="font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t(locale, "auth.email")}
                  </p>
                  <p className="font-medium text-sm truncate">
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t(locale, "admin.coins.currentBalance")}
                  </p>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="font-bold tabular-nums text-lg">
                      {selectedUser.coinBalance}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="coinAmount">
                      {t(locale, "admin.coins.coinAmount")} *
                    </Label>
                    <Input
                      id="coinAmount"
                      type="number"
                      min="1"
                      value={coinAmount}
                      onChange={(e) => setCoinAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reason">
                      {t(locale, "admin.coins.reason")} *
                    </Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={t(locale, "admin.coins.reasonPlaceholder")}
                    />
                  </div>
                </div>
                <Button
                  onClick={handleCreditCoins}
                  disabled={isCrediting || !coinAmount || !reason.trim()}
                  variant="primary"
                  className="w-full"
                >
                  <Plus className="h-4 w-4" />
                  {isCrediting
                    ? t(locale, "common.loading")
                    : t(locale, "admin.coins.creditCoins")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        {selectedUser && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">
              {t(locale, "admin.coins.transactionHistory")}
            </h2>

            {isLoadingTransactions ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  {t(locale, "common.loading")}
                </CardContent>
              </Card>
            ) : transactions.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  {t(locale, "admin.coins.noTransactions")}
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
                            {t(locale, "admin.coins.date")}
                          </TableHead>
                          <TableHead>
                            {t(locale, "admin.coins.amount")}
                          </TableHead>
                          <TableHead>
                            {t(locale, "admin.coins.reason")}
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
                                    className="font-mono"
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
                <div className="space-y-2 sm:hidden">
                  {transactions.map((tx) => {
                    const isCredit = tx.amount > 0;
                    return (
                      <Card key={tx.id}>
                        <CardContent className="p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(tx.createdAt), "PPp", {
                                locale: dateLocale,
                              })}
                            </p>
                            <div className="flex items-center gap-1">
                              {isCredit ? (
                                <ArrowUpCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                              )}
                              <Badge
                                variant={
                                  isCredit ? "default" : "destructive"
                                }
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
        )}
      </div>
    </div>
  );
}
