"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { searchUserByEmail, getUserCoinTransactions, creditCoinsAction } from "./actions";
import { Coins, Search, Plus, Minus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      showToast(t(locale, "admin.coins.emailRequired"), "error");
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchUserByEmail(searchEmail.trim());
      if (result.success && result.user) {
        setSelectedUser(result.user);
        setCoinAmount("");
        setReason("");
        loadTransactions(result.user.id);
      } else {
        showToast(result.error || t(locale, "admin.coins.userNotFound"), "error");
        setSelectedUser(null);
        setTransactions([]);
      }
    } catch (error) {
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
    } catch (error) {
      console.error("Error loading transactions:", error);
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
      const result = await creditCoinsAction(selectedUser.id, amount, reason.trim());
      if (result.success) {
        showToast(t(locale, "admin.coins.coinsCredited", { amount, name: selectedUser.name }), "success");
        setCoinAmount("");
        setReason("");
        // Reload user data
        const userResult = await searchUserByEmail(selectedUser.email);
        if (userResult.success && userResult.user) {
          setSelectedUser(userResult.user);
        }
        loadTransactions(selectedUser.id);
      } else {
        showToast(result.error || t(locale, "admin.coins.creditError"), "error");
      }
    } catch (error) {
      showToast(t(locale, "common.error"), "error");
    } finally {
      setIsCrediting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t(locale, "admin.coins.title")}</h1>
          <p className="text-muted-foreground mt-2">{t(locale, "admin.coins.description")}</p>
        </div>

        {/* Search User */}
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "admin.coins.searchUser")}</CardTitle>
            <CardDescription>{t(locale, "admin.coins.searchDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder={t(locale, "auth.emailPlaceholder")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching} variant="primary">
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? t(locale, "common.loading") : t(locale, "common.search")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Info and Credit Form */}
        {selectedUser && (
          <Card>
            <CardHeader>
              <CardTitle>{t(locale, "admin.coins.userInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>{t(locale, "auth.name")}</Label>
                  <p className="text-sm font-medium">{selectedUser.name}</p>
                </div>
                <div>
                  <Label>{t(locale, "auth.email")}</Label>
                  <p className="text-sm font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <Label>{t(locale, "admin.coins.currentBalance")}</Label>
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-primary" />
                    <p className="text-sm font-bold">{selectedUser.coinBalance}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coinAmount">{t(locale, "admin.coins.coinAmount")} *</Label>
                  <Input
                    id="coinAmount"
                    type="number"
                    min="1"
                    value={coinAmount}
                    onChange={(e) => setCoinAmount(e.target.value)}
                    placeholder="50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reason">{t(locale, "admin.coins.reason")} *</Label>
                  <Input
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t(locale, "admin.coins.reasonPlaceholder")}
                  />
                </div>
                <Button
                  onClick={handleCreditCoins}
                  disabled={isCrediting || !coinAmount || !reason.trim()}
                  variant="primary"
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isCrediting ? t(locale, "common.loading") : t(locale, "admin.coins.creditCoins")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        {selectedUser && (
          <Card>
            <CardHeader>
              <CardTitle>{t(locale, "admin.coins.transactionHistory")}</CardTitle>
              <CardDescription>{t(locale, "admin.coins.transactionDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <p className="text-center text-muted-foreground py-4">{t(locale, "common.loading")}</p>
              ) : transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">{t(locale, "admin.coins.noTransactions")}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t(locale, "admin.coins.date")}</TableHead>
                      <TableHead>{t(locale, "admin.coins.amount")}</TableHead>
                      <TableHead>{t(locale, "admin.coins.reason")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleDateString(locale, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </TableCell>
                        <TableCell>
                          <span className={transaction.amount > 0 ? "text-green-600" : "text-red-600"}>
                            {transaction.amount > 0 ? "+" : ""}{transaction.amount}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.reason}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
