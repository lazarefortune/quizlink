"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Eye, MessageSquare } from "lucide-react";
import { getFeedbacksAction, updateFeedbackStatusAction } from "./actions";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import type { FeedbackStatus } from "@/lib/schemas/feedback.schema";
import Link from "next/link";

type Feedback = {
  id: string;
  userId: string | null;
  user: { email: string; name: string } | null;
  type: string;
  message: string;
  page: string;
  userAgent: string;
  status: string;
  createdAt: Date;
};

type AdminFeedbackContentProps = {
  initialFeedbacks: Feedback[];
};

export function AdminFeedbackContent({
  initialFeedbacks,
}: AdminFeedbackContentProps) {
  const { showToast } = useToast();
  const { locale } = useLocale();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const dateLocale = locale === "fr" ? fr : enUS;

  useEffect(() => {
    setFeedbacks(initialFeedbacks);
  }, [initialFeedbacks]);

  const handleFilterChange = async () => {
    setIsLoading(true);
    try {
      const filters: { type?: string; status?: string } = {};
      if (selectedType !== "all") filters.type = selectedType;
      if (selectedStatus !== "all") filters.status = selectedStatus;

      const result = await getFeedbacksAction(filters);
      if (result.success) {
        setFeedbacks(result.feedbacks);
      } else {
        showToast(
          result.error || t(locale, "admin.feedback.errors.fetchFailed"),
          "error"
        );
      }
    } catch {
      showToast(t(locale, "admin.feedback.errors.fetchFailed"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFilterChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, selectedStatus]);

  const handleUpdateStatus = async (status: FeedbackStatus) => {
    if (!selectedFeedback) return;

    setIsUpdating(true);
    try {
      const result = await updateFeedbackStatusAction(
        selectedFeedback.id,
        status
      );
      if (result.success) {
        showToast(
          t(locale, "admin.feedback.success.statusUpdated"),
          "success"
        );
        setIsDialogOpen(false);
        await handleFilterChange();
      } else {
        showToast(
          result.error || t(locale, "admin.feedback.errors.updateFailed"),
          "error"
        );
      }
    } catch {
      showToast(t(locale, "admin.feedback.errors.updateFailed"), "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "NEW":
        return "default";
      case "IN_PROGRESS":
        return "secondary";
      case "DONE":
        return "outline";
      default:
        return "default";
    }
  };

  const getTypeVariant = (type: string) => {
    switch (type) {
      case "BUG":
        return "destructive";
      case "SUGGESTION":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href="/admin" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard admin
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {t(locale, "admin.feedback.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t(locale, "admin.feedback.description")}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t(locale, "admin.feedback.filters.type")}
            </Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t(locale, "admin.feedback.filters.allTypes")}
                </SelectItem>
                <SelectItem value="BUG">
                  {t(locale, "feedback.types.bug")}
                </SelectItem>
                <SelectItem value="SUGGESTION">
                  {t(locale, "feedback.types.suggestion")}
                </SelectItem>
                <SelectItem value="FEEDBACK">
                  {t(locale, "feedback.types.feedback")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              {t(locale, "admin.feedback.filters.status")}
            </Label>
            <Select
              value={selectedStatus}
              onValueChange={setSelectedStatus}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t(locale, "admin.feedback.filters.allStatuses")}
                </SelectItem>
                <SelectItem value="NEW">
                  {t(locale, "admin.feedback.status.new")}
                </SelectItem>
                <SelectItem value="IN_PROGRESS">
                  {t(locale, "admin.feedback.status.inProgress")}
                </SelectItem>
                <SelectItem value="DONE">
                  {t(locale, "admin.feedback.status.done")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {t(locale, "admin.feedback.loading")}
            </CardContent>
          </Card>
        ) : feedbacks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {t(locale, "admin.feedback.noFeedbacks")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop table */}
            <Card className="hidden md:block">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        {t(locale, "admin.feedback.table.date")}
                      </TableHead>
                      <TableHead>
                        {t(locale, "admin.feedback.table.user")}
                      </TableHead>
                      <TableHead>
                        {t(locale, "admin.feedback.table.type")}
                      </TableHead>
                      <TableHead>
                        {t(locale, "admin.feedback.table.status")}
                      </TableHead>
                      <TableHead>
                        {t(locale, "admin.feedback.table.page")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t(locale, "admin.feedback.table.actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedbacks.map((fb) => (
                      <TableRow key={fb.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {format(new Date(fb.createdAt), "dd/MM HH:mm", {
                            locale: dateLocale,
                          })}
                        </TableCell>
                        <TableCell>
                          {fb.user ? (
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {fb.user.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {fb.user.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {t(locale, "admin.feedback.table.userDeleted")}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTypeVariant(fb.type)}>
                            {t(
                              locale,
                              `feedback.types.${fb.type.toLowerCase()}`
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(fb.status)}>
                            {t(
                              locale,
                              `admin.feedback.status.${fb.status === "IN_PROGRESS" ? "inProgress" : fb.status.toLowerCase()}`
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                          {fb.page}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFeedback(fb);
                              setIsDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {feedbacks.map((fb) => (
                <Card
                  key={fb.id}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedFeedback(fb);
                    setIsDialogOpen(true);
                  }}
                >
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {fb.user?.name ??
                            t(locale, "admin.feedback.table.userDeleted")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(fb.createdAt), "dd/MM HH:mm", {
                            locale: dateLocale,
                          })}
                        </p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Badge variant={getTypeVariant(fb.type)}>
                          {t(
                            locale,
                            `feedback.types.${fb.type.toLowerCase()}`
                          )}
                        </Badge>
                        <Badge variant={getStatusVariant(fb.status)}>
                          {t(
                            locale,
                            `admin.feedback.status.${fb.status === "IN_PROGRESS" ? "inProgress" : fb.status.toLowerCase()}`
                          )}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm line-clamp-2">{fb.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Detail Dialog */}
        {selectedFeedback && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {t(locale, "admin.feedback.details.title")}
                </DialogTitle>
                <DialogDescription>
                  {t(locale, "admin.feedback.details.description")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getTypeVariant(selectedFeedback.type)}>
                    {t(
                      locale,
                      `feedback.types.${selectedFeedback.type.toLowerCase()}`
                    )}
                  </Badge>
                  <Badge
                    variant={getStatusVariant(selectedFeedback.status)}
                  >
                    {t(
                      locale,
                      `admin.feedback.status.${selectedFeedback.status === "IN_PROGRESS" ? "inProgress" : selectedFeedback.status.toLowerCase()}`
                    )}
                  </Badge>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t(locale, "admin.feedback.details.status")}
                  </Label>
                  <div className="flex gap-2 mt-1.5">
                    {(["NEW", "IN_PROGRESS", "DONE"] as FeedbackStatus[]).map(
                      (status) => (
                        <Button
                          key={status}
                          variant={
                            selectedFeedback.status === status
                              ? "primary"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => handleUpdateStatus(status)}
                          disabled={
                            isUpdating ||
                            selectedFeedback.status === status
                          }
                          isLoading={
                            isUpdating &&
                            selectedFeedback.status === status
                          }
                        >
                          {t(
                            locale,
                            `admin.feedback.status.${status === "IN_PROGRESS" ? "inProgress" : status.toLowerCase()}`
                          )}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {t(locale, "admin.feedback.details.user")}
                    </Label>
                    {selectedFeedback.user ? (
                      <div>
                        <p className="font-medium">
                          {selectedFeedback.user.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedFeedback.user.email}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">
                        {t(locale, "admin.feedback.table.userDeleted")}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">
                      {t(locale, "admin.feedback.details.date")}
                    </Label>
                    <p className="text-sm">
                      {format(
                        new Date(selectedFeedback.createdAt),
                        "PPp",
                        { locale: dateLocale }
                      )}
                    </p>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t(locale, "admin.feedback.details.page")}
                  </Label>
                  <p className="font-mono text-sm break-all">
                    {selectedFeedback.page}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t(locale, "admin.feedback.details.message")}
                  </Label>
                  <div className="mt-1.5 p-4 bg-muted rounded-lg whitespace-pre-wrap text-sm">
                    {selectedFeedback.message}
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">
                    {t(locale, "admin.feedback.details.userAgent")}
                  </Label>
                  <p className="font-mono text-xs text-muted-foreground break-all mt-1">
                    {selectedFeedback.userAgent}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
