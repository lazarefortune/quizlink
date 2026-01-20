"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  ArrowLeft,
  Mail,
  Trash2,
  Copy,
  Check,
  Eye,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import {
  revokeLink,
  restoreLink,
  deleteLink,
  deleteAllAttempts,
  sendLinkEmail,
  getParticipantAttemptDetails,
} from "./actions";
import { createParticipantLink } from "../actions";
import { getUserQuizzes } from "@/app/builder/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, RotateCw } from "lucide-react";

type Participant = {
  id: string;
  name: string;
  email: string | null;
  createdAt: Date;
        links: Array<{
          id: string;
          token: string;
          quizId: string;
          quizName: string;
          quizVisibility: string;
          allowMultipleAttempts: boolean;
          createdAt: Date;
          expiresAt: Date | null;
          revokedAt: Date | null;
          attempts: Array<{
            id: string;
            startedAt: Date;
            finishedAt: Date | null;
            score: number | null;
            status: string;
          }>;
        }>;
};

type ParticipantDetailsContentProps = {
  participant: Participant;
};

export function ParticipantDetailsContent({
  participant,
}: ParticipantDetailsContentProps) {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showDeleteAttemptsDialog, setShowDeleteAttemptsDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showAttemptDialog, setShowAttemptDialog] = useState(false);
  const [showCreateLinkDialog, setShowCreateLinkDialog] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Participant["links"][0] | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<{
    quizName: string;
    participantName: string;
    score: number | null;
    status: string;
    startedAt: Date;
    finishedAt: Date | null;
    answers: Array<{
      questionId: string;
      questionLabel: string;
      selectedOptionIds: string[];
      selectedOptions: Array<{ id: string; label: string }>;
      correctOptionIds: string[];
      correctOptions: Array<{ id: string; label: string }>;
      isCorrect: boolean;
      timeSpent: number | null;
    }>;
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailAddress, setEmailAddress] = useState(participant.email || "");
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState<boolean>(true);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [quizzes, setQuizzes] = useState<Array<{ id: string; name: string }>>([]);
  const [linkCopied, setLinkCopied] = useState<string | null>(null);
  const [showDeleteLinkDialog, setShowDeleteLinkDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Load available quizzes
  useEffect(() => {
    getUserQuizzes().then((result) => {
      if (result.success) {
        setQuizzes(
          result.quizzes
            .filter((q) => q.visibility === "PUBLIC")
            .map((q) => ({ id: q.id, name: q.name }))
        );
      }
    });
  }, []);

  const handleRevokeLink = async () => {
    if (!selectedLink) return;

    setIsSubmitting(true);
    try {
      const result = await revokeLink(selectedLink.id);
      if (result.success) {
        showToast(t(locale, "dashboard.linkRevoked"), "success");
        setShowRevokeDialog(false);
        setSelectedLink(null);
        router.refresh();
      } else {
        showToast(result.error || t(locale, "dashboard.linkRevokeError"), "error");
      }
    } catch {
      showToast(t(locale, "dashboard.linkRevokeError"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAllAttempts = async () => {
    if (!selectedLink) return;

    setIsSubmitting(true);
    try {
      const result = await deleteAllAttempts(selectedLink.id);
      if (result.success) {
        showToast(t(locale, "dashboard.attemptsDeleted"), "success");
        setShowDeleteAttemptsDialog(false);
        setSelectedLink(null);
        router.refresh();
      } else {
        showToast(result.error || t(locale, "dashboard.deleteAttemptsError"), "error");
      }
    } catch {
      showToast(t(locale, "dashboard.deleteAttemptsError"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedLink || !emailAddress.trim()) {
      showToast(t(locale, "dashboard.emailRequired"), "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await sendLinkEmail(selectedLink.id, emailAddress.trim());
      if (result.success) {
        showToast(t(locale, "dashboard.emailSent"), "success");
        setShowEmailDialog(false);
        setEmailAddress(participant.email || "");
      } else {
        showToast(result.error || t(locale, "dashboard.emailSendError"), "error");
      }
    } catch {
      showToast(t(locale, "dashboard.emailSendError"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEmailDialog = (link: Participant["links"][0]) => {
    setSelectedLink(link);
    setEmailAddress(participant.email || "");
    setShowEmailDialog(true);
  };

  const handleViewAttempt = async (attemptId: string) => {
    setIsLoadingDetails(true);
    setShowAttemptDialog(true);
    try {
      const result = await getParticipantAttemptDetails(attemptId);
      if (result.success) {
        setAttemptDetails(result.attempt);
      } else {
        showToast(result.error || t(locale, "common.error"), "error");
      }
    } catch {
      showToast(t(locale, "common.error"), "error");
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCreateLink = async () => {
    if (!selectedQuizId) {
      showToast(t(locale, "dashboard.selectQuiz"), "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const expiresAtDate = expiresAt ? new Date(expiresAt) : null;
      const result = await createParticipantLink(
        participant.id,
        selectedQuizId,
        allowMultipleAttempts,
        expiresAtDate
      );
      if (result.success) {
        showToast(t(locale, "dashboard.linkCreatedSuccess"), "success");
        setShowCreateLinkDialog(false);
        setSelectedQuizId("");
        setAllowMultipleAttempts(true);
        setExpiresAt("");
        router.refresh();
      } else {
        showToast(result.error || t(locale, "dashboard.createLinkError"), "error");
      }
    } catch {
      showToast(t(locale, "dashboard.createLinkError"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreLink = async () => {
    if (!selectedLink) return;

    setIsSubmitting(true);
    try {
      const result = await restoreLink(selectedLink.id);
      if (result.success) {
        showToast(t(locale, "dashboard.linkRestored"), "success");
        setShowRestoreDialog(false);
        setSelectedLink(null);
        router.refresh();
      } else {
        showToast(result.error || t(locale, "dashboard.linkRestoreError"), "error");
      }
    } catch {
      showToast(t(locale, "dashboard.linkRestoreError"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLink = async () => {
    if (!selectedLink) return;

    setIsSubmitting(true);
    try {
      const result = await deleteLink(selectedLink.id);
      if (result.success) {
        showToast(t(locale, "dashboard.linkDeleted"), "success");
        setShowDeleteLinkDialog(false);
        setSelectedLink(null);
        router.refresh();
      } else {
        showToast(result.error || t(locale, "dashboard.linkDeleteError"), "error");
      }
    } catch {
      showToast(t(locale, "dashboard.linkDeleteError"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${baseUrl}/quiz/${token}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setLinkCopied(token);
        setTimeout(() => setLinkCopied(null), 2000);
      });
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setLinkCopied(token);
      setTimeout(() => setLinkCopied(null), 2000);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            {t(locale, "dashboard.completedLabel")}
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            {t(locale, "dashboard.inProgressLabel")}
          </Badge>
        );
      case "ABANDONED":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            {t(locale, "dashboard.abandonedLabel")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/participants")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t(locale, "dashboard.backToParticipants")}
          </Button>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
            <div>
              <h1 className="text-3xl font-bold">{participant.name}</h1>
              <p className="text-muted-foreground mt-2">
                {t(locale, "dashboard.participantDetailsSubtitle")}
              </p>
              {participant.email && (
                <p className="text-sm text-muted-foreground mt-1">
                  {participant.email}
                </p>
              )}
            </div>
            <Button
              variant="primary"
              onClick={() => {
                setSelectedQuizId("");
                setShowCreateLinkDialog(true);
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              {t(locale, "dashboard.createInvitation")}
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t(locale, "dashboard.quizInvitations")}</h2>
          </div>

          {participant.links.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border rounded-lg">
              {t(locale, "dashboard.noInvitations")}
            </div>
          ) : (
            <div className="space-y-4">
              {participant.links.map((link) => (
                <div
                  key={link.id}
                  className={`border rounded-lg p-6 space-y-4 ${
                    link.revokedAt ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20" : "border-border bg-card"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{link.quizName}</h3>
                        {link.revokedAt && (
                          <Badge variant="outline" className="border-orange-500 text-orange-500">
                            {t(locale, "dashboard.revoked")}
                          </Badge>
                        )}
                        <Badge variant={link.quizVisibility === "PUBLIC" ? "default" : "outline"}>
                          {link.quizVisibility === "PUBLIC"
                            ? t(locale, "dashboard.public")
                            : t(locale, "dashboard.private")}
                        </Badge>
                      </div>
                      {link.expiresAt && (
                        <p className="text-sm text-muted-foreground">
                          {t(locale, "dashboard.expiresAt")}: {formatDate(link.expiresAt)}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="w-10 h-10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                        {link.revokedAt ? (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLink(link);
                              setShowRestoreDialog(true);
                            }}
                          >
                            <RotateCw className="h-4 w-4 mr-2" />
                            {t(locale, "dashboard.restoreLink")}
                          </DropdownMenuItem>
                        ) : (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleOpenEmailDialog(link)}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              {t(locale, "dashboard.sendByEmail")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedLink(link);
                                setShowRevokeDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t(locale, "dashboard.revokeLink")}
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedLink(link);
                            setShowDeleteLinkDialog(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t(locale, "dashboard.deleteLink")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-2">
                      {t(locale, "dashboard.linkUrl")}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        value={`${baseUrl}/quiz/${link.token}`}
                        readOnly
                        className="font-mono text-sm flex-1"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyLink(link.token)}
                        >
                          {linkCopied === link.token ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        {!link.revokedAt && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(`${baseUrl}/quiz/${link.token}`, "_blank")}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <h4 className="font-medium">{t(locale, "dashboard.attemptsLabel")}</h4>
                      {link.attempts.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLink(link);
                            setShowDeleteAttemptsDialog(true);
                          }}
                          className="text-destructive hover:text-destructive self-start sm:self-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t(locale, "dashboard.deleteAllAttempts")}
                        </Button>
                      )}
                    </div>
                    {link.attempts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t(locale, "dashboard.noAttemptsForQuiz")}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t(locale, "dashboard.startedAtLabel")}</TableHead>
                              <TableHead>{t(locale, "dashboard.finishedAtLabel")}</TableHead>
                              <TableHead>{t(locale, "dashboard.scoreLabel")}</TableHead>
                              <TableHead>{t(locale, "dashboard.statusLabel")}</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {link.attempts.map((attempt) => (
                              <TableRow key={attempt.id}>
                                <TableCell className="whitespace-nowrap">{formatDate(attempt.startedAt)}</TableCell>
                                <TableCell className="whitespace-nowrap">{formatDate(attempt.finishedAt)}</TableCell>
                                <TableCell>
                                  {attempt.score !== null
                                    ? `${attempt.score.toFixed(1)}%`
                                    : "-"}
                                </TableCell>
                                <TableCell>{getStatusBadge(attempt.status)}</TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleViewAttempt(attempt.id)}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {t(locale, "dashboard.viewAttempt")}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Revoke Link Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(locale, "dashboard.revokeLink")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLink &&
                t(locale, "dashboard.revokeLinkConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeLink}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting
                ? t(locale, "common.loading")
                : t(locale, "dashboard.revokeLink")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Attempts Dialog */}
      <AlertDialog open={showDeleteAttemptsDialog} onOpenChange={setShowDeleteAttemptsDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(locale, "dashboard.deleteAllAttempts")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLink &&
                t(locale, "dashboard.deleteAllAttemptsConfirm", { quizName: selectedLink.quizName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllAttempts}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting
                ? t(locale, "common.loading")
                : t(locale, "dashboard.deleteAllAttempts")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Link Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(locale, "dashboard.restoreLink")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLink &&
                t(locale, "dashboard.restoreLinkConfirm", { quizName: selectedLink.quizName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreLink}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t(locale, "common.loading")
                : t(locale, "dashboard.restoreLink")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Link Dialog */}
      <AlertDialog open={showDeleteLinkDialog} onOpenChange={setShowDeleteLinkDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t(locale, "dashboard.deleteLink")}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLink &&
                t(locale, "dashboard.deleteLinkConfirm", { quizName: selectedLink.quizName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLink}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting
                ? t(locale, "common.loading")
                : t(locale, "dashboard.deleteLink")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(locale, "dashboard.sendByEmail")}</DialogTitle>
            <DialogDescription>
              {t(locale, "dashboard.sendByEmail")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Email *
              </label>
              <Input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="email@example.com"
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowEmailDialog(false)}
                disabled={isSubmitting}
              >
                {t(locale, "common.cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleSendEmail}
                disabled={isSubmitting || !emailAddress.trim()}
              >
                {isSubmitting
                  ? t(locale, "common.loading")
                  : t(locale, "dashboard.sendByEmail")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Link Dialog */}
      <Dialog open={showCreateLinkDialog} onOpenChange={setShowCreateLinkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(locale, "dashboard.createLinkDialog")}</DialogTitle>
            <DialogDescription>
              {t(locale, "dashboard.createLinkDialog")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t(locale, "dashboard.selectQuiz")} *
              </label>
              <Select
                value={selectedQuizId}
                onValueChange={setSelectedQuizId}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t(locale, "dashboard.selectQuiz")} />
                </SelectTrigger>
                <SelectContent>
                  {quizzes.length === 0 ? (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      {t(locale, "dashboard.noQuizFound")}
                    </div>
                  ) : (
                    quizzes.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allow-multiple" className="text-sm font-medium">
                {t(locale, "dashboard.allowMultipleAttempts")}
              </Label>
              <Switch
                id="allow-multiple"
                checked={allowMultipleAttempts}
                onCheckedChange={setAllowMultipleAttempts}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t(locale, "dashboard.expiresAt")} <span className="text-muted-foreground text-xs">({t(locale, "common.optional")})</span>
              </label>
              <DateTimePicker
                value={expiresAt || undefined}
                onChange={(value) => setExpiresAt(value)}
                disabled={isSubmitting}
                min={new Date()}
                placeholder={t(locale, "dashboard.selectExpirationDate")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowCreateLinkDialog(false)}
                disabled={isSubmitting}
              >
                {t(locale, "common.cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateLink}
                disabled={isSubmitting || !selectedQuizId}
              >
                {isSubmitting
                  ? t(locale, "common.loading")
                  : t(locale, "dashboard.createLink")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attempt Details Dialog */}
      <Dialog open={showAttemptDialog} onOpenChange={setShowAttemptDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t(locale, "dashboard.attemptDetailsDialog")}</DialogTitle>
            <DialogDescription>
              {attemptDetails && (
                <>
                  {attemptDetails.quizName} - {attemptDetails.participantName}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="text-center py-8">
              <p>{t(locale, "common.loading")}</p>
            </div>
          ) : attemptDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t(locale, "dashboard.scoreLabel")}</p>
                  <p className="text-lg font-semibold">
                    {attemptDetails.score !== null
                      ? `${attemptDetails.score.toFixed(1)}%`
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t(locale, "dashboard.statusLabel")}</p>
                  <div className="mt-1">{getStatusBadge(attemptDetails.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t(locale, "dashboard.startedAtLabel")}
                  </p>
                  <p className="text-sm">{formatDate(attemptDetails.startedAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t(locale, "dashboard.finishedAtLabel")}
                  </p>
                  <p className="text-sm">{formatDate(attemptDetails.finishedAt)}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-4">
                  {t(locale, "dashboard.attemptDetails")}
                </h3>
                <div className="space-y-4">
                  {attemptDetails.answers.map((answer, index: number) => (
                    <div
                      key={answer.questionId}
                      className={`border rounded-lg p-4 space-y-3 ${
                        answer.isCorrect
                          ? "border-green-500 bg-green-50/50 dark:bg-green-950/20"
                          : "border-red-500 bg-red-50/50 dark:bg-red-950/20"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium">
                          {t(locale, "dashboard.questionLabel")} {index + 1}
                        </h4>
                        {answer.isCorrect ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            {t(locale, "dashboard.correctLabel")}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-red-500 text-red-500">
                            <XCircle className="h-3 w-3 mr-1" />
                            {t(locale, "dashboard.incorrectLabel")}
                          </Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-3">{answer.questionLabel}</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            {t(locale, "dashboard.yourAnswerLabel")}
                          </p>
                          <div className="space-y-1">
                            {answer.selectedOptions && answer.selectedOptions.length > 0 ? (
                              answer.selectedOptions.map((opt) => (
                                <Badge
                                  key={opt.id}
                                  variant="outline"
                                  className={
                                    answer.correctOptionIds.includes(opt.id)
                                      ? "border-green-500 text-green-500"
                                      : "border-red-500 text-red-500"
                                  }
                                >
                                  {opt.label}
                                </Badge>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {t(locale, "quiz.noAnswer")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            {t(locale, "dashboard.correctAnswerLabel")}
                          </p>
                          <div className="space-y-1">
                            {answer.correctOptions && answer.correctOptions.length > 0 ? (
                              answer.correctOptions.map((opt) => (
                                <Badge key={opt.id} variant="default" className="bg-green-500">
                                  {opt.label}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                {t(locale, "quiz.noAnswer")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {answer.timeSpent && (
                        <div className="text-sm text-muted-foreground pt-2 border-t">
                          {t(locale, "dashboard.timeSpentLabel")}: {formatDuration(answer.timeSpent)}{" "}
                          {t(locale, "dashboard.secondsLabel")}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
