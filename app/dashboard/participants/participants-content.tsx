"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Plus, Edit, Trash2, Eye } from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import {
  getParticipants,
  createParticipant,
  updateParticipant,
  deleteParticipant,
} from "./actions";

type Participant = {
  id: string;
  name: string;
  email: string | null;
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const participantsResult = await getParticipants();

      if (participantsResult.success) {
        setParticipants(participantsResult.participants);
      }
    } catch {
      // Error handled by getParticipants
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
      const result = await createParticipant(formName.trim(), formEmail.trim() || undefined);
      if (result.success) {
        showToast(t(locale, "dashboard.participantCreatedSuccess"), "success");
        setShowCreateDialog(false);
        setFormName("");
        setFormEmail("");
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
        formEmail.trim() || undefined
      );
      if (result.success) {
        showToast(t(locale, "dashboard.participantUpdatedSuccess"), "success");
        setShowEditDialog(false);
        setSelectedParticipant(null);
        setFormName("");
        setFormEmail("");
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>{t(locale, "common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Button
            variant="secondary"
            onClick={() => router.push("/dashboard")}
            className="mb-4"
        >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t(locale, "dashboard.backToDashboard")}
        </Button>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              {t(locale, "dashboard.participantsManagement")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {t(locale, "dashboard.participantsManagementSubtitle")}
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setFormName("");
              setFormEmail("");
              setShowCreateDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {t(locale, "dashboard.createParticipant")}
          </Button>
        </div>

        {participants.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                {t(locale, "dashboard.noParticipantsYet")}
              </p>
              <Button
                variant="primary"
                onClick={() => {
                  setFormName("");
                  setFormEmail("");
                  setShowCreateDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t(locale, "dashboard.createFirstParticipant")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>{t(locale, "dashboard.participants")}</CardTitle>
              <CardDescription>
                {t(locale, "dashboard.participantsManagementSubtitle")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t(locale, "dashboard.participantNameLabel")}</TableHead>
                    <TableHead>{t(locale, "dashboard.participantEmailLabel")}</TableHead>
                    <TableHead>{t(locale, "dashboard.attemptsCountLabel")}</TableHead>
                    <TableHead>{t(locale, "dashboard.quizzesLabel")}</TableHead>
                    <TableHead>{t(locale, "dashboard.actionsLabel")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">{participant.name}</TableCell>
                      <TableCell>{participant.email || "-"}</TableCell>
                      <TableCell>{participant.attemptsCount}</TableCell>
                      <TableCell>
                        {participant.quizzes.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {participant.quizzes.map((q) => (
                              <span
                                key={q.quizId}
                                className="text-xs bg-muted px-2 py-1 rounded"
                              >
                                {q.quizName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/dashboard/participants/${participant.id}`)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(participant)}
                            title={t(locale, "dashboard.editParticipant")}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedParticipant(participant);
                              setShowDeleteDialog(true);
                            }}
                            title={t(locale, "dashboard.deleteParticipant")}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(locale, "dashboard.createParticipantDialog")}</DialogTitle>
            <DialogDescription>
              {t(locale, "dashboard.participantsManagementSubtitle")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t(locale, "dashboard.participantNameLabel")} *
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t(locale, "quiz.participantNamePlaceholder")}
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
                placeholder={t(locale, "quiz.participantEmailPlaceholder")}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setShowCreateDialog(false)}
                disabled={isSubmitting}
              >
                {t(locale, "common.cancel")}
              </Button>
              <Button
                variant="primary"
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
            <DialogTitle>{t(locale, "dashboard.editParticipantDialog")}</DialogTitle>
            <DialogDescription>
              {t(locale, "dashboard.participantsManagementSubtitle")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t(locale, "dashboard.participantNameLabel")} *
              </label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t(locale, "quiz.participantNamePlaceholder")}
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
                placeholder={t(locale, "quiz.participantEmailPlaceholder")}
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
            <AlertDialogTitle>{t(locale, "dashboard.deleteParticipantDialog")}</AlertDialogTitle>
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
