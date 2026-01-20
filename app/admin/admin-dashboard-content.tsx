"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins, Search, Plus, Minus, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { searchUsers, creditCoinsAction, getCoinTransactions } from "./actions";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import Link from "next/link";

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  coinBalance: number;
  createdAt: Date;
  _count: {
    quizzes: number;
  };
};

type AdminDashboardContentProps = {
  initialUsers: User[];
};

export function AdminDashboardContent({ initialUsers }: AdminDashboardContentProps) {
  const { showToast } = useToast();
  const { locale } = useLocale();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isCrediting, setIsCrediting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const dateFormatter = (date: Date) =>
    format(date, "dd/MM/yyyy", { locale: locale === "fr" ? fr : enUS });

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setUsers(initialUsers);
      return;
    }

    setIsSearching(true);
    try {
      const result = await searchUsers(searchTerm.trim());
      if (result.success) {
        setUsers(result.users);
      } else {
        showToast(result.error || t(locale, "admin.searchError"), "error");
      }
    } catch (error) {
      showToast(t(locale, "admin.searchError"), "error");
    } finally {
      setIsSearching(false);
    }
  };

  const handleOpenDialog = (user: User) => {
    setSelectedUser(user);
    setCoinAmount("");
    setReason("");
    setIsDialogOpen(true);
  };

  const handleCreditCoins = async (type: "add" | "remove") => {
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
    const finalAmount = type === "add" ? amount : -amount;

    try {
      const result = await creditCoinsAction(
        selectedUser.id,
        finalAmount,
        reason.trim()
      );

      if (result.success) {
        showToast(
          t(locale, "admin.coins.creditSuccess"),
          "success"
        );
        setIsDialogOpen(false);
        setSelectedUser(null);
        setCoinAmount("");
        setReason("");

        // Refresh users list
        await handleSearch();
      } else {
        showToast(result.error || t(locale, "admin.coins.creditError"), "error");
      }
    } catch (error) {
      showToast(t(locale, "admin.coins.creditError"), "error");
    } finally {
      setIsCrediting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t(locale, "admin.dashboard.title")}</h1>
            <p className="text-muted-foreground mt-2">{t(locale, "admin.dashboard.description")}</p>
          </div>
          <Link href="/admin/coins">
            <Button variant="secondary">
              <Coins className="h-4 w-4 mr-2" />
              {t(locale, "admin.dashboard.manageCoins")}
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "admin.dashboard.searchUsers")}</CardTitle>
            <CardDescription>{t(locale, "admin.dashboard.searchDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="search"
                placeholder={t(locale, "admin.dashboard.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? t(locale, "common.loading") : t(locale, "common.search")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t(locale, "admin.dashboard.usersList")}</CardTitle>
            <CardDescription>
              {t(locale, "admin.dashboard.totalUsers", { count: users.length })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t(locale, "admin.dashboard.name")}</TableHead>
                    <TableHead>{t(locale, "admin.dashboard.email")}</TableHead>
                    <TableHead>{t(locale, "admin.dashboard.role")}</TableHead>
                    <TableHead className="text-right">{t(locale, "admin.dashboard.coins")}</TableHead>
                    <TableHead className="text-right">{t(locale, "admin.dashboard.quizzes")}</TableHead>
                    <TableHead>{t(locale, "admin.dashboard.createdAt")}</TableHead>
                    <TableHead className="text-right">{t(locale, "admin.dashboard.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        {t(locale, "admin.dashboard.noUsers")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Coins className="h-4 w-4 text-primary" />
                            <span className="font-medium">{user.coinBalance}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{user._count.quizzes}</TableCell>
                        <TableCell>{dateFormatter(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Dialog open={isDialogOpen && selectedUser?.id === user.id} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(user)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                {t(locale, "admin.dashboard.manage")}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                              <DialogHeader>
                                <DialogTitle>{t(locale, "admin.dashboard.manageUser")}</DialogTitle>
                                <DialogDescription>
                                  {t(locale, "admin.dashboard.manageUserDescription")}
                                </DialogDescription>
                              </DialogHeader>
                              {selectedUser && (
                                <div className="space-y-4 py-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label>{t(locale, "admin.dashboard.name")}</Label>
                                      <p className="text-sm font-medium">{selectedUser.name}</p>
                                    </div>
                                    <div>
                                      <Label>{t(locale, "admin.dashboard.email")}</Label>
                                      <p className="text-sm font-medium">{selectedUser.email}</p>
                                    </div>
                                    <div>
                                      <Label>{t(locale, "admin.dashboard.role")}</Label>
                                      <Badge variant={selectedUser.role === "ADMIN" ? "default" : "secondary"}>
                                        {selectedUser.role}
                                      </Badge>
                                    </div>
                                    <div>
                                      <Label>{t(locale, "admin.dashboard.currentBalance")}</Label>
                                      <div className="flex items-center gap-1">
                                        <Coins className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-bold">{selectedUser.coinBalance}</span>
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
                                      <Textarea
                                        id="reason"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder={t(locale, "admin.coins.reasonPlaceholder")}
                                        rows={3}
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        onClick={() => handleCreditCoins("add")}
                                        disabled={isCrediting || !coinAmount || !reason.trim()}
                                        variant="primary"
                                        className="flex-1"
                                      >
                                        <Plus className="h-4 w-4 mr-2" />
                                        {isCrediting ? t(locale, "common.loading") : t(locale, "admin.coins.addCoins")}
                                      </Button>
                                      <Button
                                        onClick={() => handleCreditCoins("remove")}
                                        disabled={isCrediting || !coinAmount || !reason.trim()}
                                        variant="destructive"
                                        className="flex-1"
                                      >
                                        <Minus className="h-4 w-4 mr-2" />
                                        {isCrediting ? t(locale, "common.loading") : t(locale, "admin.coins.removeCoins")}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
