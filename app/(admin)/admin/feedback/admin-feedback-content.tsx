"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { getFeedbacksAction, updateFeedbackStatusAction } from "./actions";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import type { FeedbackType, FeedbackStatus } from "@/lib/schemas/feedback.schema";

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

export function AdminFeedbackContent({ initialFeedbacks }: AdminFeedbackContentProps) {
  const { showToast } = useToast();
  const { locale } = useLocale();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(initialFeedbacks);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const dateFormatter = (date: Date) =>
    format(date, "dd/MM/yyyy HH:mm", { locale: locale === "fr" ? fr : enUS });

  useEffect(() => {
    setFeedbacks(initialFeedbacks);
  }, [initialFeedbacks]);

  const handleFilterChange = async () => {
    setIsLoading(true);
    try {
      const filters: { type?: string; status?: string } = {};
      if (selectedType !== "all") {
        filters.type = selectedType;
      }
      if (selectedStatus !== "all") {
        filters.status = selectedStatus;
      }

      const result = await getFeedbacksAction(filters);
      if (result.success) {
        setFeedbacks(result.feedbacks);
      } else {
        showToast(result.error || t(locale, "admin.feedback.errors.fetchFailed"), "error");
      }
    } catch (error) {
      console.error("[AdminFeedbackContent] Error fetching feedbacks:", error);
      showToast(t(locale, "admin.feedback.errors.fetchFailed"), "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleFilterChange();
  }, [selectedType, selectedStatus]);

  const handleOpenDialog = (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (status: FeedbackStatus) => {
    if (!selectedFeedback) return;

    setIsUpdating(true);
    try {
      const result = await updateFeedbackStatusAction(selectedFeedback.id, status);
      if (result.success) {
        showToast(t(locale, "admin.feedback.success.statusUpdated"), "success");
        setIsDialogOpen(false);
        // Refresh feedbacks
        await handleFilterChange();
      } else {
        showToast(result.error || t(locale, "admin.feedback.errors.updateFailed"), "error");
      }
    } catch (error) {
      console.error("[AdminFeedbackContent] Error updating status:", error);
      showToast(t(locale, "admin.feedback.errors.updateFailed"), "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
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

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "BUG":
        return "destructive";
      case "SUGGESTION":
        return "secondary";
      case "FEEDBACK":
        return "default";
      default:
        return "default";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t(locale, "admin.feedback.title")}</CardTitle>
          <CardDescription>{t(locale, "admin.feedback.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 space-y-2">
              <Label>{t(locale, "admin.feedback.filters.type")}</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t(locale, "admin.feedback.filters.allTypes")}</SelectItem>
                  <SelectItem value="BUG">{t(locale, "feedback.types.bug")}</SelectItem>
                  <SelectItem value="SUGGESTION">
                    {t(locale, "feedback.types.suggestion")}
                  </SelectItem>
                  <SelectItem value="FEEDBACK">{t(locale, "feedback.types.feedback")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <Label>{t(locale, "admin.feedback.filters.status")}</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t(locale, "admin.feedback.filters.allStatuses")}</SelectItem>
                  <SelectItem value="NEW">{t(locale, "admin.feedback.status.new")}</SelectItem>
                  <SelectItem value="IN_PROGRESS">
                    {t(locale, "admin.feedback.status.inProgress")}
                  </SelectItem>
                  <SelectItem value="DONE">{t(locale, "admin.feedback.status.done")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">{t(locale, "admin.feedback.loading")}</div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t(locale, "admin.feedback.noFeedbacks")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t(locale, "admin.feedback.table.date")}</TableHead>
                    <TableHead>{t(locale, "admin.feedback.table.user")}</TableHead>
                    <TableHead>{t(locale, "admin.feedback.table.type")}</TableHead>
                    <TableHead>{t(locale, "admin.feedback.table.status")}</TableHead>
                    <TableHead>{t(locale, "admin.feedback.table.page")}</TableHead>
                    <TableHead>{t(locale, "admin.feedback.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell className="font-mono text-xs">
                        {dateFormatter(feedback.createdAt)}
                      </TableCell>
                      <TableCell>
                        {feedback.user ? (
                          <div>
                            <div className="font-medium">{feedback.user.name}</div>
                            <div className="text-sm text-muted-foreground">{feedback.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">
                            {t(locale, "admin.feedback.table.userDeleted")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(feedback.type)}>
                          {t(locale, `feedback.types.${feedback.type.toLowerCase()}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(feedback.status)}>
                          {t(locale, `admin.feedback.status.${feedback.status.toLowerCase()}`)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm">
                        {feedback.page}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(feedback)}
                        >
                          {t(locale, "admin.feedback.table.view")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedFeedback && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t(locale, "admin.feedback.details.title")}</DialogTitle>
              <DialogDescription>
                {t(locale, "admin.feedback.details.description")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">
                  {t(locale, "admin.feedback.details.type")}
                </Label>
                <Badge variant={getTypeBadgeVariant(selectedFeedback.type)}>
                  {t(locale, `feedback.types.${selectedFeedback.type.toLowerCase()}`)}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-semibold">
                  {t(locale, "admin.feedback.details.status")}
                </Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={selectedFeedback.status === "NEW" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateStatus("NEW")}
                    disabled={isUpdating || selectedFeedback.status === "NEW"}
                    isLoading={isUpdating && selectedFeedback.status === "NEW"}
                  >
                    {t(locale, "admin.feedback.status.new")}
                  </Button>
                  <Button
                    variant={selectedFeedback.status === "IN_PROGRESS" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateStatus("IN_PROGRESS")}
                    disabled={isUpdating || selectedFeedback.status === "IN_PROGRESS"}
                    isLoading={isUpdating && selectedFeedback.status === "IN_PROGRESS"}
                  >
                    {t(locale, "admin.feedback.status.inProgress")}
                  </Button>
                  <Button
                    variant={selectedFeedback.status === "DONE" ? "primary" : "outline"}
                    size="sm"
                    onClick={() => handleUpdateStatus("DONE")}
                    disabled={isUpdating || selectedFeedback.status === "DONE"}
                    isLoading={isUpdating && selectedFeedback.status === "DONE"}
                  >
                    {t(locale, "admin.feedback.status.done")}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">
                  {t(locale, "admin.feedback.details.user")}
                </Label>
                <div className="mt-1">
                  {selectedFeedback.user ? (
                    <div>
                      <div>{selectedFeedback.user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedFeedback.user.email}
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      {t(locale, "admin.feedback.table.userDeleted")}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">
                  {t(locale, "admin.feedback.details.page")}
                </Label>
                <div className="mt-1 font-mono text-sm">{selectedFeedback.page}</div>
              </div>

              <div>
                <Label className="text-sm font-semibold">
                  {t(locale, "admin.feedback.details.userAgent")}
                </Label>
                <div className="mt-1 font-mono text-xs text-muted-foreground break-all">
                  {selectedFeedback.userAgent}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">
                  {t(locale, "admin.feedback.details.message")}
                </Label>
                <div className="mt-2 p-4 bg-muted rounded-md whitespace-pre-wrap">
                  {selectedFeedback.message}
                </div>
              </div>

              <div>
                <Label className="text-sm font-semibold">
                  {t(locale, "admin.feedback.details.date")}
                </Label>
                <div className="mt-1 font-mono text-sm">
                  {dateFormatter(selectedFeedback.createdAt)}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
