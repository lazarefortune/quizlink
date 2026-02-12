"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Coins, Search, Plus, Minus, Eye, Users, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { searchUsers, creditCoinsAction } from "./actions";
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

  const dateLocale = locale === "fr" ? fr : enUS;

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
    } catch {
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
        showToast(t(locale, "admin.coins.creditSuccess"), "success");
        setIsDialogOpen(false);
        setSelectedUser(null);
        setCoinAmount("");
        setReason("");
        await handleSearch();
      } else {
        showToast(result.error || t(locale, "admin.coins.creditError"), "error");
      }
    } catch {
      showToast(t(locale, "admin.coins.creditError"), "error");
    } finally {
      setIsCrediting(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {t(locale, "admin.dashboard.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t(locale, "admin.dashboard.description")}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue/10 text-blue">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{users.length}</p>
                <p className="text-xs text-muted-foreground">
                  {t(locale, "admin.dashboard.usersList")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {users.reduce((sum, u) => sum + u._count.quizzes, 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(locale, "admin.dashboard.quizzes")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <Coins className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {users.reduce((sum, u) => sum + u.coinBalance, 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t(locale, "admin.dashboard.coins")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <Input
            type="search"
            placeholder={t(locale, "admin.dashboard.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-md"
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

        {/* Desktop table */}
        <Card className="hidden md:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t(locale, "admin.dashboard.name")}</TableHead>
                  <TableHead>{t(locale, "admin.dashboard.email")}</TableHead>
                  <TableHead>{t(locale, "admin.dashboard.role")}</TableHead>
                  <TableHead className="text-right">
                    {t(locale, "admin.dashboard.coins")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t(locale, "admin.dashboard.quizzes")}
                  </TableHead>
                  <TableHead>{t(locale, "admin.dashboard.createdAt")}</TableHead>
                  <TableHead className="text-right">
                    {t(locale, "admin.dashboard.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-muted-foreground py-8"
                    >
                      {t(locale, "admin.dashboard.noUsers")}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === "ADMIN" ? "default" : "secondary"
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Coins className="h-4 w-4 text-primary" />
                          <span className="font-medium tabular-nums">
                            {user.coinBalance}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-primary hover:underline font-medium"
                        >
                          {user._count.quizzes}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(user.createdAt), "dd MMM yyyy", {
                          locale: dateLocale,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <Link href={`/admin/users/${user.id}`}>
                              <FileText className="h-4 w-4 mr-1" />
                              {t(locale, "admin.dashboard.viewQuizzes")}
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(user)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {t(locale, "admin.dashboard.manage")}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {users.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {t(locale, "admin.dashboard.noUsers")}
              </CardContent>
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="font-medium tabular-nums">
                        {user.coinBalance}
                      </span>
                    </div>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="flex items-center gap-1 text-primary"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">
                        {user._count.quizzes} quiz
                      </span>
                    </Link>
                    <span className="text-muted-foreground ml-auto">
                      {format(new Date(user.createdAt), "dd/MM/yy", {
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => handleOpenDialog(user)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t(locale, "admin.dashboard.manage")}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Manage Dialog */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setSelectedUser(null);
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {t(locale, "admin.dashboard.manageUser")}
              </DialogTitle>
              <DialogDescription>
                {t(locale, "admin.dashboard.manageUserDescription")}
              </DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t(locale, "admin.dashboard.name")}
                    </Label>
                    <p className="font-medium">{selectedUser.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t(locale, "admin.dashboard.email")}
                    </Label>
                    <p className="font-medium text-sm truncate">
                      {selectedUser.email}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t(locale, "admin.dashboard.role")}
                    </Label>
                    <Badge
                      variant={
                        selectedUser.role === "ADMIN" ? "default" : "secondary"
                      }
                    >
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t(locale, "admin.dashboard.currentBalance")}
                    </Label>
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="font-bold tabular-nums">
                        {selectedUser.coinBalance}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
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
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCreditCoins("add")}
                      disabled={
                        isCrediting || !coinAmount || !reason.trim()
                      }
                      variant="primary"
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4" />
                      {isCrediting
                        ? t(locale, "common.loading")
                        : t(locale, "admin.coins.addCoins")}
                    </Button>
                    <Button
                      onClick={() => handleCreditCoins("remove")}
                      disabled={
                        isCrediting || !coinAmount || !reason.trim()
                      }
                      variant="destructive"
                      className="flex-1"
                    >
                      <Minus className="h-4 w-4" />
                      {isCrediting
                        ? t(locale, "common.loading")
                        : t(locale, "admin.coins.removeCoins")}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
