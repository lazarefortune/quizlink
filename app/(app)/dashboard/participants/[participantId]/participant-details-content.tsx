"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Trash2,
  Copy,
  Check,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  RotateCw,
  Sparkles,
  FileText,
  Target,
  TrendingUp,
  Plus,
  Ban,
  Share2,
  CalendarClock,
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
  toggleParticipantPortal,
  updateLinkExpiration,
  sendPortalLinkEmail,
} from "./actions";
import { createParticipantLink } from "../actions";
import { getUserQuizzes } from "@/app/(app)/builder/actions";
import { ParticipantAvatar } from "@/components/participant-avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Participant = {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  createdAt: Date;
  publicToken: string | null;
  isPortalEnabled: boolean;
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

  // Dialog states
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showDeleteAttemptsDialog, setShowDeleteAttemptsDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [showCreateLinkDialog, setShowCreateLinkDialog] = useState(false);
  const [showDeleteLinkDialog, setShowDeleteLinkDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showExpirationDialog, setShowExpirationDialog] = useState(false);
  const [editExpiresAt, setEditExpiresAt] = useState<string>("");

  const [selectedLink, setSelectedLink] = useState<Participant["links"][0] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailAddress, setEmailAddress] = useState(participant.email || "");

  // Create link form
  const [selectedQuizId, setSelectedQuizId] = useState<string>("");
  const [allowMultipleAttempts, setAllowMultipleAttempts] = useState<boolean>(true);
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [quizzes, setQuizzes] = useState<Array<{ id: string; name: string }>>([]);

  const [linkCopied, setLinkCopied] = useState<string | null>(null);
  const [isTogglingPortal, setIsTogglingPortal] = useState(false);
  const [portalLinkCopied, setPortalLinkCopied] = useState(false);
  const [portalEmailAddress, setPortalEmailAddress] = useState(participant.email || "");
  const [isSendingPortalEmail, setIsSendingPortalEmail] = useState(false);
  const [showPortalEmailField, setShowPortalEmailField] = useState(false);

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
            .map((q) => ({ id: q.id, name: q.name })),
        );
      }
    });
  }, []);

  // --- Computed stats ---
  const totalAttempts = participant.links.reduce(
    (sum, link) => sum + link.attempts.length,
    0,
  );
  const completedAttempts = participant.links.reduce(
    (sum, link) =>
      sum + link.attempts.filter((a) => a.status === "COMPLETED").length,
    0,
  );
  const allScores = participant.links
    .flatMap((link) => link.attempts)
    .filter((a) => a.status === "COMPLETED" && a.score !== null)
    .map((a) => a.score as number);
  const averageScore =
    allScores.length > 0
      ? Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length)
      : null;

  // --- Handlers ---
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
        expiresAtDate,
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

  const handleUpdateExpiration = async () => {
    if (!selectedLink) return;
    setIsSubmitting(true);
    try {
      const newExpiresAt = editExpiresAt ? new Date(editExpiresAt) : null;
      const result = await updateLinkExpiration(selectedLink.id, newExpiresAt);
      if (result.success) {
        showToast(
          locale === "fr"
            ? "Date d'expiration mise à jour"
            : "Expiration date updated",
          "success",
        );
        setShowExpirationDialog(false);
        setSelectedLink(null);
        router.refresh();
      } else {
        showToast(result.error || t(locale, "common.error"), "error");
      }
    } catch {
      showToast(t(locale, "common.error"), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = (token: string) => {
    const url = `${baseUrl}/quiz/${token}`;
    navigator.clipboard?.writeText(url).then(() => {
      setLinkCopied(token);
      showToast(t(locale, "dashboard.linkCopiedParticipant"), "success");
      setTimeout(() => setLinkCopied(null), 2000);
    });
  };

  const handleTogglePortal = async (enabled: boolean) => {
    setIsTogglingPortal(true);
    try {
      const result = await toggleParticipantPortal(participant.id, enabled);
      if (result.success) {
        showToast(
          enabled
            ? t(locale, "dashboard.portalEnabled")
            : t(locale, "dashboard.portalDisabled"),
          "success",
        );
        router.refresh();
      } else {
        showToast(result.error || t(locale, "dashboard.portalToggleError"), "error");
      }
    } catch {
      showToast(t(locale, "dashboard.portalToggleError"), "error");
    } finally {
      setIsTogglingPortal(false);
    }
  };

  const handleCopyPortalLink = () => {
    if (!participant.publicToken) return;
    const url = `${baseUrl}/p/${participant.publicToken}`;
    navigator.clipboard?.writeText(url).then(() => {
      setPortalLinkCopied(true);
      showToast(t(locale, "dashboard.portalLinkCopied"), "success");
      setTimeout(() => setPortalLinkCopied(false), 2000);
    });
  };

  const handleSendPortalEmail = async () => {
    if (!portalEmailAddress.trim()) {
      showToast(t(locale, "dashboard.emailRequired"), "error");
      return;
    }
    setIsSendingPortalEmail(true);
    try {
      const result = await sendPortalLinkEmail(
        participant.id,
        portalEmailAddress.trim(),
      );
      if (result.success) {
        showToast(t(locale, "dashboard.emailSent"), "success");
        setShowPortalEmailField(false);
      } else {
        showToast(result.error || t(locale, "dashboard.emailSendError"), "error");
      }
    } catch {
      showToast(t(locale, "dashboard.emailSendError"), "error");
    } finally {
      setIsSendingPortalEmail(false);
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

  const formatDateShort = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="space-y-6 sm:space-y-8">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/participants")}
          className="text-muted-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          {t(locale, "dashboard.backToParticipants")}
        </Button>

        {/* Header: participant info + action */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <ParticipantAvatar
              avatar={participant.avatar}
              name={participant.name}
              size="xl"
            />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {participant.name}
              </h1>
              {participant.email && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {participant.email}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {t(locale, "dashboard.participantCreatedLabel")}:{" "}
                {formatDateShort(participant.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="secondary"
              className="shrink-0"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="h-4 w-4" />
              <span className="sm:inline hidden ml-1">
                {locale === "fr" ? "Partager" : "Share"}
              </span>
            </Button>
            <Button
              variant="blue"
              className="flex-1 sm:flex-initial shrink-0"
              onClick={() => {
                setSelectedQuizId("");
                setAllowMultipleAttempts(true);
                setExpiresAt("");
                setShowCreateLinkDialog(true);
              }}
            >
              <Plus className="h-4 w-4" />
              {locale === "fr" ? "Inscrire à un quiz" : "Enroll in a quiz"}
            </Button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue/10 text-blue">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {participant.links.length}
                </p>
                <p className="text-sm text-muted-foreground">
                  {locale === "fr" ? "Quiz inscrits" : "Quizzes enrolled"}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{totalAttempts}</p>
                <p className="text-sm text-muted-foreground">
                  {totalAttempts <= 1
                    ? (locale === "fr" ? "Tentative" : "Attempt")
                    : (locale === "fr" ? "Tentatives" : "Attempts")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-highlight/10 text-highlight">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {completedAttempts}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t(locale, "dashboard.completed")}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {averageScore !== null ? `${averageScore}%` : "-"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {locale === "fr" ? "Score moyen" : "Avg. score"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quiz list */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            {locale === "fr" ? "Quiz inscrits" : "Enrolled quizzes"}
          </h2>

          {participant.links.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
                  <FileText className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {t(locale, "dashboard.noInvitations")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {participant.links.map((link) => {
                const lastAttempt =
                  link.attempts.length > 0 ? link.attempts[0] : null;
                const completedCount = link.attempts.filter(
                  (a) => a.status === "COMPLETED",
                ).length;
                const bestScore = link.attempts
                  .filter((a) => a.score !== null)
                  .reduce(
                    (best, a) => Math.max(best, a.score as number),
                    -1,
                  );

                return (
                  <Card
                    key={link.id}
                    className={cn(
                      link.revokedAt &&
                        "border-orange-500/40 bg-orange-50/30 dark:bg-orange-950/10",
                    )}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start justify-between gap-3">
                        {/* Quiz info */}
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted mt-0.5">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold truncate">
                                {link.quizName}
                              </p>
                              {link.revokedAt && (
                                <Badge
                                  variant="outline"
                                  className="border-orange-500 text-orange-500 text-xs"
                                >
                                  {t(locale, "dashboard.revoked")}
                                </Badge>
                              )}
                              {link.expiresAt && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs gap-1",
                                    new Date(link.expiresAt) < new Date()
                                      ? "border-destructive text-destructive"
                                      : "border-muted-foreground text-muted-foreground",
                                  )}
                                >
                                  <CalendarClock className="h-3 w-3" />
                                  {new Date(link.expiresAt) < new Date()
                                    ? (locale === "fr" ? "Expiré" : "Expired")
                                    : (locale === "fr"
                                        ? `Expire le ${formatDate(link.expiresAt)}`
                                        : `Expires ${formatDate(link.expiresAt)}`)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                              <span>
                                {link.attempts.length}{" "}
                                {link.attempts.length <= 1
                                  ? (locale === "fr" ? "tentative" : "attempt")
                                  : (locale === "fr" ? "tentatives" : "attempts")}
                              </span>
                              {bestScore >= 0 && (
                                <span>
                                  {locale === "fr" ? "Meilleur" : "Best"}:{" "}
                                  {bestScore.toFixed(0)}%
                                </span>
                              )}
                              {lastAttempt && (
                                <span>
                                  {locale === "fr"
                                    ? "Dernière"
                                    : "Last"}:{" "}
                                  {formatDate(lastAttempt.startedAt)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {link.attempts.length > 0 && (
                            <Link
                              href={`/dashboard/participants/${participant.id}/quiz/${link.id}`}
                              className="text-blue text-sm font-medium hidden sm:inline-flex items-center gap-1 hover:underline px-3 py-1.5"
                            >
                              {locale === "fr" ? "Voir plus" : "See more"}
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {link.attempts.length > 0 && (
                                <DropdownMenuItem
                                  className="sm:hidden"
                                  asChild
                                >
                                  <Link
                                    href={`/dashboard/participants/${participant.id}/quiz/${link.id}`}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    {locale === "fr"
                                      ? "Voir les tentatives"
                                      : "View attempts"}
                                  </Link>
                                </DropdownMenuItem>
                              )}
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
                                    onClick={() => handleCopyLink(link.token)}
                                  >
                                    {linkCopied === link.token ? (
                                      <Check className="h-4 w-4 mr-2" />
                                    ) : (
                                      <Copy className="h-4 w-4 mr-2" />
                                    )}
                                    {t(locale, "dashboard.copyLink")}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedLink(link);
                                      setEmailAddress(participant.email || "");
                                      setShowEmailDialog(true);
                                    }}
                                  >
                                    <Mail className="h-4 w-4 mr-2" />
                                    {t(locale, "dashboard.sendByEmail")}
                                  </DropdownMenuItem>
                                  {link.attempts.length > 0 && (
                                    <DropdownMenuItem asChild>
                                      <Link
                                        href={`/dashboard/quiz/${link.quizId}/participants/${participant.id}/report`}
                                        className="flex items-center cursor-pointer"
                                      >
                                        <Sparkles className="h-4 w-4 mr-2" />
                                        {locale === "fr"
                                          ? "Rapport IA"
                                          : "AI report"}
                                      </Link>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedLink(link);
                                      setEditExpiresAt(
                                        link.expiresAt
                                          ? new Date(link.expiresAt).toISOString().slice(0, 16)
                                          : "",
                                      );
                                      setShowExpirationDialog(true);
                                    }}
                                  >
                                    <CalendarClock className="h-4 w-4 mr-2" />
                                    {locale === "fr"
                                      ? "Modifier l'expiration"
                                      : "Edit expiration"}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedLink(link);
                                      setShowRevokeDialog(true);
                                    }}
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
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
                                {locale === "fr" ? "Supprimer" : "Delete"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Mobile: "Voir plus" as full-width link */}
                      {link.attempts.length > 0 && (
                        <Link
                          href={`/dashboard/participants/${participant.id}/quiz/${link.id}`}
                          className="flex items-center justify-center gap-1 text-blue text-sm font-medium w-full mt-3 py-1.5 hover:underline sm:hidden"
                        >
                          {locale === "fr" ? "Voir plus" : "See more"}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ==================== DIALOGS ==================== */}

      {/* Share portal dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {locale === "fr" ? "Lien public du participant" : "Participant public link"}
            </DialogTitle>
            <DialogDescription>
              {locale === "fr"
                ? "Partagez ce lien pour permettre au participant d'accéder à son portail."
                : "Share this link to allow the participant to access their portal."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="portal-toggle" className="text-sm font-medium">
                {locale === "fr" ? "Activer le partage" : "Enable sharing"}
              </Label>
              <Switch
                id="portal-toggle"
                checked={participant.isPortalEnabled}
                onCheckedChange={handleTogglePortal}
                disabled={isTogglingPortal}
              />
            </div>
            {participant.isPortalEnabled && participant.publicToken && (
              <div className="space-y-3">
                <div className="rounded-lg bg-muted p-3">
                  <code className="text-sm break-all">
                    {baseUrl}/p/{participant.publicToken}
                  </code>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="blue"
                    className="flex-1"
                    onClick={handleCopyPortalLink}
                  >
                    {portalLinkCopied ? (
                      <Check className="h-4 w-4 mr-1" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {portalLinkCopied
                      ? (locale === "fr" ? "Copié !" : "Copied!")
                      : (locale === "fr" ? "Copier" : "Copy")}
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setPortalEmailAddress(participant.email || "");
                      setShowPortalEmailField(!showPortalEmailField);
                    }}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    {locale === "fr" ? "Envoyer par email" : "Send by email"}
                  </Button>
                </div>
                {showPortalEmailField && (
                  <div className="space-y-2 pt-1">
                    <Label>Email</Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        value={portalEmailAddress}
                        onChange={(e) => setPortalEmailAddress(e.target.value)}
                        disabled={isSendingPortalEmail}
                        placeholder="email@example.com"
                        className="flex-1"
                      />
                      <Button
                        variant="blue"
                        size="sm"
                        onClick={handleSendPortalEmail}
                        disabled={isSendingPortalEmail || !portalEmailAddress.trim()}
                        className="shrink-0 px-4"
                      >
                        {isSendingPortalEmail
                          ? t(locale, "common.loading")
                          : (locale === "fr" ? "Envoyer" : "Send")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {!participant.isPortalEnabled && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {locale === "fr"
                  ? "Activez le partage pour générer un lien public."
                  : "Enable sharing to generate a public link."}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke Link Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(locale, "dashboard.revokeLink")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(locale, "dashboard.revokeLinkConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeLink}
              disabled={isSubmitting}
              className={buttonVariants({ variant: "destructive" })}
            >
              {isSubmitting
                ? t(locale, "common.loading")
                : t(locale, "dashboard.revokeLink")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Attempts Dialog */}
      <AlertDialog
        open={showDeleteAttemptsDialog}
        onOpenChange={setShowDeleteAttemptsDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(locale, "dashboard.deleteAllAttempts")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLink &&
                t(locale, "dashboard.deleteAllAttemptsConfirm", {
                  quizName: selectedLink.quizName,
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllAttempts}
              disabled={isSubmitting}
              className={buttonVariants({ variant: "destructive" })}
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
            <AlertDialogTitle>
              {t(locale, "dashboard.restoreLink")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLink &&
                t(locale, "dashboard.restoreLinkConfirm", {
                  quizName: selectedLink.quizName,
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreLink} disabled={isSubmitting}>
              {isSubmitting
                ? t(locale, "common.loading")
                : t(locale, "dashboard.restoreLink")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Link Dialog */}
      <AlertDialog
        open={showDeleteLinkDialog}
        onOpenChange={setShowDeleteLinkDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(locale, "dashboard.deleteLink")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedLink &&
                t(locale, "dashboard.deleteLinkConfirm", {
                  quizName: selectedLink.quizName,
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLink}
              disabled={isSubmitting}
              className={buttonVariants({ variant: "destructive" })}
            >
              {isSubmitting
                ? t(locale, "common.loading")
                : t(locale, "dashboard.deleteLink")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Expiration Dialog */}
      <Dialog open={showExpirationDialog} onOpenChange={setShowExpirationDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {locale === "fr"
                ? "Modifier la date d'expiration"
                : "Edit expiration date"}
            </DialogTitle>
            <DialogDescription>
              {locale === "fr"
                ? "Définissez ou supprimez la date d'expiration de ce quiz."
                : "Set or remove the expiration date for this quiz."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>
                {t(locale, "dashboard.expiresAt")}{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  ({t(locale, "common.optional")})
                </span>
              </Label>
              <DateTimePicker
                value={editExpiresAt || undefined}
                onChange={(value) => setEditExpiresAt(value)}
                disabled={isSubmitting}
              />
            </div>
            {editExpiresAt && (
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setEditExpiresAt("")}
              >
                {locale === "fr"
                  ? "Supprimer la date d'expiration"
                  : "Remove expiration date"}
              </Button>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowExpirationDialog(false)}
                disabled={isSubmitting}
              >
                {t(locale, "common.cancel")}
              </Button>
              <Button
                variant="blue"
                onClick={handleUpdateExpiration}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? t(locale, "common.loading")
                  : (locale === "fr" ? "Enregistrer" : "Save")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t(locale, "dashboard.sendByEmail")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowEmailDialog(false)}
                disabled={isSubmitting}
              >
                {t(locale, "common.cancel")}
              </Button>
              <Button
                variant="blue"
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

      {/* Create Link (Enroll) Dialog */}
      <Dialog open={showCreateLinkDialog} onOpenChange={setShowCreateLinkDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {locale === "fr" ? "Inscrire à un quiz" : "Enroll in a quiz"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>{t(locale, "dashboard.selectQuiz")} *</Label>
              <Select
                value={selectedQuizId}
                onValueChange={setSelectedQuizId}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(locale, "dashboard.selectQuiz")}
                  />
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
            <div className="space-y-2">
              <Label>
                {t(locale, "dashboard.expiresAt")}{" "}
                <span className="text-muted-foreground text-xs font-normal">
                  ({t(locale, "common.optional")})
                </span>
              </Label>
              <DateTimePicker
                value={expiresAt || undefined}
                onChange={(value) => setExpiresAt(value)}
                disabled={isSubmitting}
                min={new Date()}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowCreateLinkDialog(false)}
                disabled={isSubmitting}
              >
                {t(locale, "common.cancel")}
              </Button>
              <Button
                variant="blue"
                onClick={handleCreateLink}
                disabled={isSubmitting || !selectedQuizId}
              >
                {isSubmitting
                  ? t(locale, "common.loading")
                  : locale === "fr"
                    ? "Inscrire"
                    : "Enroll"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
