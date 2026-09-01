"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Coins, Eye, FileText, Minus, Plus, Search, X } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  formatDateTimeOrDash,
  formatMediumDate,
} from "@/lib/date-time/format";
import { useTimeZone } from "@/lib/date-time/timezone-provider";
import { useLocale } from "@/lib/i18n/use-locale";

import { creditCoinsAction, getUsersPageAction, searchUsers } from "../actions";

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
};

const pageSizeOptions = [10, 25, 50, 100];
const sectionMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

export function AdminUsersContent({
  users,
  currentPage,
  pageSize,
  totalUsers,
}: AdminUsersContentProps) {
  const { locale } = useLocale();
  const { timeZone } = useTimeZone();
  const { showToast } = useToast();

  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [coinAmount, setCoinAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isCrediting, setIsCrediting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [pagedUsers, setPagedUsers] = useState<UserRow[]>(users);
  const [displayedUsers, setDisplayedUsers] = useState<UserRow[]>(users);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPageState, setCurrentPageState] = useState(currentPage);
  const [pageSizeState, setPageSizeState] = useState(pageSize);
  const [totalUsersState, setTotalUsersState] = useState(totalUsers);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [listAnimationKey, setListAnimationKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalUsersState / pageSizeState));

  useEffect(() => {
    if (!isSearching) {
      setDisplayedUsers(pagedUsers);
    }
  }, [pagedUsers, isSearching]);

  useEffect(() => {
    const term = searchInput.trim();
    const debounce = window.setTimeout(async () => {
      if (!term) {
        setIsSearching(false);
        setDisplayedUsers(pagedUsers);
        return;
      }

      try {
        const result = await searchUsers(term);
        if (!result.success) {
          showToast(result.error || t(locale, "admin.dashboard.searchUsers"), "error");
          return;
        }

        setIsSearching(true);
        setDisplayedUsers(result.users);
      } catch {
        showToast(t(locale, "admin.dashboard.searchUsers"), "error");
      }
    }, 350);

    return () => {
      window.clearTimeout(debounce);
    };
  }, [searchInput, pagedUsers, locale, showToast]);

  const loadUsersPage = async (nextPage: number, nextPageSize: number) => {
    setIsPageLoading(true);
    try {
      const result = await getUsersPageAction(nextPage, nextPageSize);
      if (!result.success) {
        showToast(result.error || "Failed to fetch users", "error");
        return;
      }

      setPagedUsers(result.users);
      setDisplayedUsers(result.users);
      setCurrentPageState(result.currentPage);
      setPageSizeState(result.pageSize);
      setTotalUsersState(result.totalUsers);
      setListAnimationKey((current) => current + 1);
      setIsSearching(false);
      setSearchInput("");
    } catch {
      showToast("Failed to fetch users", "error");
    } finally {
      setIsPageLoading(false);
    }
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
      await loadUsersPage(currentPageState, pageSizeState);
    } catch {
      showToast(t(locale, "admin.coins.creditError"), "error");
    } finally {
      setIsCrediting(false);
    }
  };

  return (
    <div className="px-1 lg:px-3">
      <div className="space-y-6">
        <motion.div
          initial={sectionMotion.initial}
          animate={sectionMotion.animate}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <h1 className="text-3xl sm:text-4xl font-bold">
            {t(locale, "admin.users.title")}
          </h1>
          <p className="text-base text-muted-foreground mt-1">
            {t(locale, "admin.users.description")}
          </p>
        </motion.div>

        <motion.div
          initial={sectionMotion.initial}
          animate={sectionMotion.animate}
          transition={{ duration: 0.24, delay: 0.04, ease: "easeOut" }}
        >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="w-full md:w-80">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t(locale, "admin.dashboard.searchPlaceholder")}
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    className="w-full pr-10 pl-9 text-base"
                  />
                  {(isSearching || searchInput.trim().length > 0) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        setIsSearching(false);
                        setDisplayedUsers(users);
                      }}
                      aria-label="Annuler la recherche"
                      className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="page-size" className="text-sm font-medium">
                  {t(locale, "admin.users.perPage")}
                </Label>
                <Select
                  value={String(pageSizeState)}
                  onValueChange={(value) =>
                    loadUsersPage(1, Number.parseInt(value, 10))
                  }
                >
                  <SelectTrigger id="page-size" className="h-10 w-[92px] text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`desktop-list-${listAnimationKey}`}
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="hidden md:block"
          >
            <Card>
              <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-base">
                      {t(locale, "admin.dashboard.name")}
                    </TableHead>
                    <TableHead className="text-base">
                      {t(locale, "admin.dashboard.email")}
                    </TableHead>
                    <TableHead className="text-base">
                      {t(locale, "admin.dashboard.role")}
                    </TableHead>
                    <TableHead className="text-base">
                      {t(locale, "admin.dashboard.authMethod")}
                    </TableHead>
                    <TableHead className="text-base">
                      {t(locale, "admin.dashboard.createdAt")}
                    </TableHead>
                    <TableHead className="text-base">
                      {t(locale, "admin.dashboard.verifiedAt")}
                    </TableHead>
                    <TableHead className="text-base">
                      {t(locale, "admin.dashboard.lastLoginAt")}
                    </TableHead>
                    <TableHead className="text-base text-right">
                      {t(locale, "admin.dashboard.coins")}
                    </TableHead>
                    <TableHead className="text-base text-right">
                      {t(locale, "admin.dashboard.quizzes")}
                    </TableHead>
                    <TableHead className="text-base text-right">
                      {t(locale, "admin.dashboard.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={10}
                        className="text-center text-muted-foreground py-8 text-base"
                      >
                        {t(locale, "admin.dashboard.noUsers")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-semibold text-base whitespace-nowrap">
                          {user.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-base whitespace-nowrap">
                          {user.email}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant={
                              user.role === "ADMIN" ? "default" : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant={
                              user.hasGoogleAccount ? "default" : "secondary"
                            }
                          >
                            {user.hasGoogleAccount
                              ? t(locale, "admin.dashboard.authGoogle")
                              : t(locale, "admin.dashboard.authPassword")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-base whitespace-nowrap">
                          {formatMediumDate(user.createdAt, locale, timeZone)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-base whitespace-nowrap">
                          {formatDateTimeOrDash(user.verifiedAt, locale, timeZone)}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-base whitespace-nowrap">
                          {formatDateTimeOrDash(user.lastLoginAt, locale, timeZone)}
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Coins className="h-4 w-4 text-primary" />
                            <span className="font-semibold tabular-nums text-base">
                              {user.coinBalance}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-base whitespace-nowrap">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-primary hover:underline font-semibold"
                          >
                            {user._count.quizzes}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" asChild>
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
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={`mobile-list-${listAnimationKey}`}
            initial={{ opacity: 0, y: 16, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="space-y-3 md:hidden"
          >
            {displayedUsers.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-base text-muted-foreground">
                  {t(locale, "admin.dashboard.noUsers")}
                </CardContent>
              </Card>
            ) : (
              displayedUsers.map((user) => (
                <Card key={user.id}>
                  <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">
                        {user.name}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                    >
                      {user.role}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        {t(locale, "admin.dashboard.authMethod")}
                      </p>
                      <p className="font-medium">
                        {user.hasGoogleAccount
                          ? t(locale, "admin.dashboard.authGoogle")
                          : t(locale, "admin.dashboard.authPassword")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {t(locale, "admin.dashboard.coins")}
                      </p>
                      <div className="flex items-center gap-1 font-medium">
                        <Coins className="h-4 w-4 text-primary" />
                        <span className="tabular-nums">{user.coinBalance}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {t(locale, "admin.dashboard.verifiedAt")}
                      </p>
                      <p className="font-medium">
                        {formatDateTimeOrDash(user.verifiedAt, locale, timeZone)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {t(locale, "admin.dashboard.lastLoginAt")}
                      </p>
                      <p className="font-medium">
                        {formatDateTimeOrDash(user.lastLoginAt, locale, timeZone)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {t(locale, "admin.dashboard.createdAt")}
                      </p>
                      <p className="font-medium">
                        {formatMediumDate(user.createdAt, locale, timeZone)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {t(locale, "admin.dashboard.quizzes")}
                      </p>
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="font-semibold text-primary hover:underline"
                      >
                        {user._count.quizzes}
                      </Link>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      asChild
                    >
                      <Link href={`/admin/users/${user.id}`}>
                        <FileText className="mr-1 h-4 w-4" />
                        {t(locale, "admin.dashboard.viewQuizzes")}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenDialog(user)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      {t(locale, "admin.dashboard.manage")}
                    </Button>
                  </div>
                  </CardContent>
                </Card>
              ))
            )}
          </motion.div>
        </AnimatePresence>

        {isSearching ? (
          <motion.div
            initial={sectionMotion.initial}
            animate={sectionMotion.animate}
            transition={{ duration: 0.24, delay: 0.12, ease: "easeOut" }}
            className="flex items-center justify-between gap-3"
          >
            <p className="text-sm text-muted-foreground">
              {displayedUsers.length} {t(locale, "admin.dashboard.totalUsers", { count: displayedUsers.length })}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchInput("");
                setIsSearching(false);
                        setDisplayedUsers(pagedUsers);
              }}
            >
              Reset
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={sectionMotion.initial}
            animate={sectionMotion.animate}
            transition={{ duration: 0.24, delay: 0.12, ease: "easeOut" }}
            className="flex items-center justify-between"
          >
            <p className="text-sm text-muted-foreground">
              {t(locale, "admin.users.pageIndicator")} {currentPageState} /{" "}
              {totalPages} ({totalUsersState})
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={isPageLoading || currentPageState <= 1}
                onClick={() => loadUsersPage(currentPageState - 1, pageSizeState)}
              >
                {t(locale, "admin.users.previous")}
              </Button>
              <Button
                variant="outline"
                disabled={isPageLoading || currentPageState >= totalPages}
                onClick={() => loadUsersPage(currentPageState + 1, pageSizeState)}
              >
                {t(locale, "admin.users.next")}
              </Button>
            </div>
          </motion.div>
        )}

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
                      onChange={(event) => setCoinAmount(event.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reason">
                      {t(locale, "admin.coins.reason")} *
                    </Label>
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
                      {isCrediting
                        ? t(locale, "common.loading")
                        : t(locale, "admin.coins.addCoins")}
                    </Button>
                    <Button
                      onClick={() => handleCreditCoins("remove")}
                      disabled={isCrediting || !coinAmount || !reason.trim()}
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
