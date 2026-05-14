"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/utils";
import { Plus, Edit, Trash2, Eye, Users } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { ParticipantAvatar } from "@/components/participant-avatar";
import {
  getParticipants,
  createParticipant,
  updateParticipant,
  deleteParticipant,
} from "./actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type Participant = {
  id: string;
  name: string;
  email: string | null;
  avatar: string | null;
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  createdAt: Date;
  attemptsCount: number;
  quizzes: Array<{
    quizId: string;
    quizName: string;
    linkToken: string;
  }>;
};


export function ParticipantsContent() {
  const router = useRouter();
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formGender, setFormGender] = useState<"MALE" | "FEMALE" | "OTHER" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadData on mount only
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const participantsResult = await getParticipants();

      if (participantsResult.success) {
        setParticipants(participantsResult.participants);
      } else {
        showToast(participantsResult.error ?? t(locale, "common.error"), "error");
      }
    } catch {
      showToast(t(locale, "common.error"), "error");
    } finally {
      setIsLoading(false);
    }
  }

  const handleCreate = async () => {
    if (!formName.trim()) {
      showToast(t(locale, "quiz.participantNameRequired"), "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createParticipant(
        formName.trim(),
        formEmail.trim() || undefined,
        formGender || undefined
      );
      if (result.success) {
        showToast(t(locale, "dashboard.participantCreatedSuccess"), "success");
        setShowCreateDialog(false);
        setFormName("");
        setFormEmail("");
        setFormGender(null);
        loadData();
      } else {
        showToast(result.error || t(locale, "dashboard.createParticipantError"), "error");
      }
      } catch {
        showToast(t(locale, "dashboard.createParticipantError"), "error");
      } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (participant: Participant) => {
    setSelectedParticipant(participant);
    setFormName(participant.name);
    setFormEmail(participant.email || "");
    setFormGender(participant.gender || null);
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!selectedParticipant || !formName.trim()) {
      showToast(t(locale, "quiz.participantNameRequired"), "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateParticipant(
        selectedParticipant.id,
        formName.trim(),
        formEmail.trim() || undefined,
        formGender || undefined
      );
      if (result.success) {
        showToast(t(locale, "dashboard.participantUpdatedSuccess"), "success");
        setShowEditDialog(false);
        setSelectedParticipant(null);
        setFormName("");
        setFormEmail("");
        setFormGender(null);
        loadData();
      } else {
        showToast(result.error || t(locale, "dashboard.updateParticipantError"), "error");
      }
      } catch {
        showToast(t(locale, "dashboard.updateParticipantError"), "error");
      } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedParticipant) return;

    setIsSubmitting(true);
    try {
      const result = await deleteParticipant(selectedParticipant.id);
      if (result.success) {
        showToast(t(locale, "dashboard.participantDeletedSuccess"), "success");
        setShowDeleteDialog(false);
        setSelectedParticipant(null);
        loadData();
      } else {
        showToast(result.error || t(locale, "dashboard.deleteParticipantError"), "error");
      }
      } catch {
        showToast(t(locale, "dashboard.deleteParticipantError"), "error");
      } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <p className="text-muted-foreground">{t(locale, "common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-background p-4 sm:p-6 lg:p-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <div className="flex flex-col items-start gap-2 sm:gap-3">
            <div>
              <h1 className="text-2xl h1 font-bold tracking-tight sm:text-3xl text-foreground">
                {t(locale, "dashboard.participantsManagement")}
              </h1>
            </div>
            <Badge
              variant="secondary"
              className="shrink-0 font-normal tabular-nums"
            >
              <Users className="mr-1 h-3.5 w-3.5" />
              {participants.length}{" "}
              {participants.length === 1
                ? t(locale, "dashboard.participantOne")
                : t(locale, "dashboard.participants")}
            </Badge>
          </div>
          <Button
            variant="blue"
            className="w-full sm:w-auto shrink-0"
            onClick={() => {
              setFormName("");
              setFormEmail("");
              setFormGender(null);
              setShowCreateDialog(true);
            }}
          >
            <Plus className="h-4 w-4" />
            {t(locale, "dashboard.createParticipant")}
          </Button>
        </div>

        {participants.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue/10 text-blue">
                <Users className="h-7 w-7" />
              </div>
              <p className="mt-4 text-muted-foreground">
                {t(locale, "dashboard.noParticipantsYet")}
              </p>
              <Button
                variant="blue"
                className="mt-6"
                onClick={() => {
                  setFormName("");
                  setFormEmail("");
                  setFormGender(null);
                  setShowCreateDialog(true);
                }}
              >
                <Plus className="h-4 w-4" />
                {t(locale, "dashboard.createFirstParticipant")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop: table */}
            <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">
                      {t(locale, "dashboard.participantNameLabel")}
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      {t(locale, "dashboard.quizzesLabel")}
                    </TableHead>
                    <TableHead className="text-muted-foreground">
                      {t(locale, "dashboard.attemptsCountLabel")}
                    </TableHead>
                    <TableHead className="w-[120px] text-right text-muted-foreground">
                      {t(locale, "dashboard.actionsLabel")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow
                      key={participant.id}
                      role="button"
                      tabIndex={0}
                      className="border-border cursor-pointer transition-colors hover:bg-muted/50"
                      onClick={() =>
                        router.push(`/dashboard/participants/${participant.id}`)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(
                            `/dashboard/participants/${participant.id}`,
                          );
                        }
                      }}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ParticipantAvatar
                            avatar={participant.avatar}
                            name={participant.name}
                            size="sm"
                          />
                          <span className="font-medium">
                            {participant.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {participant.quizzes.length}
                      </TableCell>
                      <TableCell className="tabular-nums">
                        {participant.attemptsCount}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/dashboard/participants/${participant.id}`,
                              );
                            }}
                            title={t(locale, "dashboard.viewDetails")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(participant);
                            }}
                            title={t(locale, "dashboard.editParticipant")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedParticipant(participant);
                              setShowDeleteDialog(true);
                            }}
                            title={t(locale, "dashboard.deleteParticipant")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
              {participants.map((participant) => (
                <Card
                  key={participant.id}
                  className="border-border transition-shadow hover:shadow-md cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    router.push(`/dashboard/participants/${participant.id}`)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/dashboard/participants/${participant.id}`);
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <ParticipantAvatar
                          avatar={participant.avatar}
                          name={participant.name}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-base font-semibold truncate">
                            {participant.name}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {participant.quizzes.length}{" "}
                            {t(
                              locale,
                              participant.quizzes.length <= 1
                                ? "dashboard.quizSingular"
                                : "dashboard.quizPlural",
                            )}
                            {participant.attemptsCount > 0 &&
                              ` · ${participant.attemptsCount} ${t(locale, "dashboard.attemptsLabel")}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(participant);
                          }}
                          title={t(locale, "dashboard.editParticipant")}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedParticipant(participant);
                            setShowDeleteDialog(true);
                          }}
                          title={t(locale, "dashboard.deleteParticipant")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {t(locale, "dashboard.createParticipantDialog")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>
                {t(locale, "dashboard.participantGenderLabel")}{" "}
                <span className="text-muted-foreground font-normal">
                  ({t(locale, "common.optional")})
                </span>
              </Label>
              <Select
                value={formGender ?? "NOT_SPECIFIED"}
                onValueChange={(value) =>
                  setFormGender(
                    value === "NOT_SPECIFIED"
                      ? null
                      : (value as "MALE" | "FEMALE" | "OTHER"),
                  )
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      locale,
                      "dashboard.participantGenderNotSpecified",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">
                    {t(locale, "dashboard.participantGenderMale")}
                  </SelectItem>
                  <SelectItem value="FEMALE">
                    {t(locale, "dashboard.participantGenderFemale")}
                  </SelectItem>
                  <SelectItem value="OTHER">
                    {t(locale, "dashboard.participantGenderOther")}
                  </SelectItem>
                  <SelectItem value="NOT_SPECIFIED">
                    {t(locale, "dashboard.participantGenderNotSpecified")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t(locale, "dashboard.participantNameLabel")} *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>
                {t(locale, "dashboard.participantEmailLabel")}{" "}
                <span className="text-muted-foreground font-normal">
                  ({t(locale, "common.optional")})
                </span>
              </Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setShowCreateDialog(false)}
                disabled={isSubmitting}
              >
                {t(locale, "common.cancel")}
              </Button>
              <Button
                variant="blue"
                onClick={handleCreate}
                disabled={isSubmitting || !formName.trim()}
              >
                {isSubmitting
                  ? t(locale, "common.loading")
                  : t(locale, "dashboard.createParticipant")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t(locale, "dashboard.editParticipantDialog")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t(locale, "dashboard.participantGenderLabel")}{" "}
                <span className="text-muted-foreground text-xs">
                  ({t(locale, "common.optional")})
                </span>
              </label>
              <Select
                value={formGender || "NOT_SPECIFIED"}
                onValueChange={(value) =>
                  setFormGender(
                    value === "NOT_SPECIFIED"
                      ? null
                      : (value as "MALE" | "FEMALE" | "OTHER"),
                  )
                }
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      locale,
                      "dashboard.participantGenderNotSpecified",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">
                    {t(locale, "dashboard.participantGenderMale")}
                  </SelectItem>
                  <SelectItem value="FEMALE">
                    {t(locale, "dashboard.participantGenderFemale")}
                  </SelectItem>
                  <SelectItem value="OTHER">
                    {t(locale, "dashboard.participantGenderOther")}
                  </SelectItem>
                  <SelectItem value="NOT_SPECIFIED">
                    {t(locale, "dashboard.participantGenderNotSpecified")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t(locale, "dashboard.participantNameLabel")} *
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t(locale, "dashboard.participantEmailLabel")}{" "}
                <span className="text-muted-foreground text-xs">
                  ({t(locale, "common.optional")})
                </span>
              </label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowEditDialog(false)}
                disabled={isSubmitting}
              >
                {t(locale, "common.cancel")}
              </Button>
              <Button
                variant="primary"
                onClick={handleUpdate}
                disabled={isSubmitting || !formName.trim()}
              >
                {isSubmitting
                  ? t(locale, "common.loading")
                  : t(locale, "dashboard.editParticipant")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(locale, "dashboard.deleteParticipantDialog")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedParticipant &&
                t(locale, "dashboard.deleteParticipantConfirm", {
                  name: selectedParticipant.name,
                })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              {t(locale, "common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className={cn(
                buttonVariants({ variant: "destructive" }),
                "shadow-[var(--shadow-gaming-highlight),var(--shadow-gaming-depth-destructive)] hover:bg-destructive/85 hover:shadow-[var(--shadow-gaming-highlight),var(--shadow-gaming-depth-destructive)] active:bg-destructive/90 active:shadow-none active:translate-y-[4px]",
              )}
            >
              {isSubmitting
                ? t(locale, "common.loading")
                : t(locale, "dashboard.deleteParticipant")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
