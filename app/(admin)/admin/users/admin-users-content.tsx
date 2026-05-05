"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { enUS, fr } from "date-fns/locale";
import { Coins, Eye, FileText, Minus, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

import { creditCoinsAction } from "../actions";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  coinBalance: number;
  verifiedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  hasGoogleAccount: boolean;
  _count: {
    quizzes: number;
  };
};

type AdminUsersContentProps = {
  users: UserRow[];
  currentPage: number;
  pageSize: number;
  totalUsers: number;
  search: string;
};

function formatDate(date: Date | null, locale: string): string {
  if (!date) {
    return "-";
  }
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const pageSizeOptions = [10, 25, 50, 100];

export function AdminUsersContent({
  users,
  currentPage,
  pageSize,
  totalUsers,
  search,
}: AdminUsersContentProps) {
  const { locale } = useLocale();
  const { showToast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dateLocale = locale === "fr" ? fr : enUS;

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isCrediting, setIsCrediting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(search);

  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));

  const updateQuery = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const onSearch = () => {
    updateQuery({
      search: searchInput.trim() || undefined,
      page: "1",
    });
  };

  const handleOpenDialog = (user: UserRow) => {
    setSelectedUser(user);
    setCoinAmount("");
    setReason("");
    setIsDialogOpen(true);
  };

  const handleCreditCoins = async (type: "add" | "remove") => {
    if (!selectedUser) return;

    const amount = Number.parseInt(coinAmount, 10);
    if (Number.isNaN(amount) || amount <= 0) {
      showToast(t(locale, "admin.coins.invalidAmount"), "error");
      return;
    }
    if (!reason.trim()) {
      showToast(t(locale, "admin.coins.reasonRequired"), "error");
      return;
    }

    setIsCrediting(true);
    try {
      const finalAmount = type === "add" ? amount : -amount;
      const result = await creditCoinsAction(selectedUser.id, finalAmount, reason.trim());
      if (!result.success) {
        showToast(result.error || t(locale, "admin.coins.creditError"), "error");
        return;
      }

      showToast(t(locale, "admin.coins.creditSuccess"), "success");
      setIsDialogOpen(false);
      setSelectedUser(null);
      router.refresh();
    } catch {
      showToast(t(locale, "admin.coins.creditError"), "error");
    } finally {
      setIsCrediting(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">{t(locale, "admin.users.title")}</h1>
          <p className="text-base text-muted-foreground mt-1">{t(locale, "admin.users.description")}</p>
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              <Input
                type="search"
                placeholder={t(locale, "admin.dashboard.searchPlaceholder")}
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onSearch();
                }}
                className="w-full md:w-80 text-base"
              />
              <Button onClick={onSearch}>{t(locale, "common.search")}</Button>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="page-size" className="text-sm font-medium">
                {t(locale, "admin.users.perPage")}
              </Label>
              <select
                id="page-size"
                className="h-10 rounded-md border border-input bg-background px-3 text-base"
                value={pageSize}
                onChange={(event) =>
                  updateQuery({
                    pageSize: event.target.value,
                    page: "1",
                  })
                }
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="hidden md:block">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base">{t(locale, "admin.dashboard.name")}</TableHead>
                  <TableHead className="text-base">{t(locale, "admin.dashboard.email")}</TableHead>
                  <TableHead className="text-base">{t(locale, "admin.dashboard.role")}</TableHead>
                  <TableHead className="text-base">{t(locale, "admin.dashboard.authMethod")}</TableHead>
                  <TableHead className="text-base">{t(locale, "admin.dashboard.verifiedAt")}</TableHead>
                  <TableHead className="text-base">{t(locale, "admin.dashboard.lastLoginAt")}</TableHead>
                  <TableHead className="text-base text-right">{t(locale, "admin.dashboard.coins")}</TableHead>
                  <TableHead className="text-base text-right">{t(locale, "admin.dashboard.quizzes")}</TableHead>
                  <TableHead className="text-base">{t(locale, "admin.dashboard.createdAt")}</TableHead>
                  <TableHead className="text-base text-right">{t(locale, "admin.dashboard.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8 text-base">
                      {t(locale, "admin.dashboard.noUsers")}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-semibold text-base">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground text-base">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.hasGoogleAccount ? "default" : "secondary"}>
                          {user.hasGoogleAccount
                            ? t(locale, "admin.dashboard.authGoogle")
                            : t(locale, "admin.dashboard.authPassword")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-base">{formatDate(user.verifiedAt, locale)}</TableCell>
                      <TableCell className="text-base">{formatDate(user.lastLoginAt, locale)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Coins className="h-4 w-4 text-primary" />
                          <span className="font-semibold tabular-nums text-base">{user.coinBalance}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-base">
                        <Link href={`/admin/users/${user.id}`} className="text-primary hover:underline font-semibold">
                          {user._count.quizzes}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap text-base">
                        {format(new Date(user.createdAt), "dd MMM yyyy", { locale: dateLocale })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <FileText className="h-4 w-4 mr-1" />
                              {t(locale, "admin.dashboard.viewQuizzes")}
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(user)}>
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

        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t(locale, "admin.users.pageIndicator")} {currentPage} / {totalPages} ({totalUsers})
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={currentPage <= 1}
              onClick={() => updateQuery({ page: String(currentPage - 1) })}
            >
              {t(locale, "admin.users.previous")}
            </Button>
            <Button
              variant="outline"
              disabled={currentPage >= totalPages}
              onClick={() => updateQuery({ page: String(currentPage + 1) })}
            >
              {t(locale, "admin.users.next")}
            </Button>
          </div>
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setSelectedUser(null);
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t(locale, "admin.dashboard.manageUser")}</DialogTitle>
              <DialogDescription>{t(locale, "admin.dashboard.manageUserDescription")}</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">{t(locale, "admin.dashboard.name")}</Label>
                    <p className="font-medium">{selectedUser.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">{t(locale, "admin.dashboard.email")}</Label>
                    <p className="font-medium text-sm truncate">{selectedUser.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">{t(locale, "admin.dashboard.role")}</Label>
                    <Badge variant={selectedUser.role === "ADMIN" ? "default" : "secondary"}>
                      {selectedUser.role}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">
                      {t(locale, "admin.dashboard.currentBalance")}
                    </Label>
                    <div className="flex items-center gap-1">
                      <Coins className="h-4 w-4 text-primary" />
                      <span className="font-bold tabular-nums">{selectedUser.coinBalance}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="coinAmount">{t(locale, "admin.coins.coinAmount")} *</Label>
                    <Input
                      id="coinAmount"
                      type="number"
                      min="1"
                      value={coinAmount}
                      onChange={(event) => setCoinAmount(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reason">{t(locale, "admin.coins.reason")} *</Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleCreditCoins("add")}
                      disabled={isCrediting || !coinAmount || !reason.trim()}
                      variant="primary"
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4" />
                      {isCrediting ? t(locale, "common.loading") : t(locale, "admin.coins.addCoins")}
                    </Button>
                    <Button
                      onClick={() => handleCreditCoins("remove")}
                      disabled={isCrediting || !coinAmount || !reason.trim()}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Minus className="h-4 w-4" />
                      {isCrediting ? t(locale, "common.loading") : t(locale, "admin.coins.removeCoins")}
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
