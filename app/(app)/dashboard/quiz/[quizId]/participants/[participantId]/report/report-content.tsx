"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { generateQuizParticipantReportAction, sendReportByEmailAction } from "./actions";
import type { ParticipantReportOutput } from "@/lib/ai/participant-report-schema";
import { buildReportPdfBlob, reportPdfBlobToBase64 } from "@/lib/ai/participant-report-pdf";
import {
  ArrowLeft,
  Sparkles,
  Target,
  AlertTriangle,
  BookOpen,
  Calendar,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Download,
  Mail,
  Loader2,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { track } from "@/lib/analytics/track";
import { REPORT_GENERATED } from "@/lib/analytics/events";
import { buildCommonEventProps } from "@/lib/analytics/props";

type ParticipantReportContentProps = {
  quizId: string;
  quizName: string;
  questionsCount: number;
  participantId: string;
  participantName: string;
  participantEmail?: string;
  attemptsCount: number;
  coinBalance: number;
  canGenerate: boolean;
  isAdmin: boolean;
  backHref?: string;
};

export function ParticipantReportContent({
  quizId,
  quizName,
  questionsCount,
  participantId,
  participantName,
  participantEmail,
  attemptsCount,
  coinBalance,
  canGenerate,
  isAdmin,
  backHref,
}: ParticipantReportContentProps) {
  const [report, setReport] = useState<ParticipantReportOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<string | null>("summary");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState(participantEmail ?? "");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { showToast } = useToast();
  const { locale } = useLocale();
  const backLink = backHref ?? `/dashboard/quiz/${quizId}`;

  const openEmailDialog = useCallback(() => {
    setEmailAddress(participantEmail ?? "");
    setEmailError(null);
    setEmailDialogOpen(true);
  }, [participantEmail]);

  const handleDownloadPdf = useCallback(() => {
    if (!report) return;
    try {
      const blob = buildReportPdfBlob(report, { participantName, quizName }, locale);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        locale === "fr"
          ? `Rapport-IA-${participantName.replace(/[^a-zA-Z0-9-_]/g, "-")}-${quizName.replace(/[^a-zA-Z0-9-_]/g, "-")}.pdf`
          : `AI-Report-${participantName.replace(/[^a-zA-Z0-9-_]/g, "-")}-${quizName.replace(/[^a-zA-Z0-9-_]/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(
        locale === "fr" ? "Téléchargement démarré." : "Download started.",
        "success"
      );
    } catch (_e) {
      showToast(
        locale === "fr" ? "Erreur lors du téléchargement du PDF." : "Error downloading PDF.",
        "error"
      );
    }
  }, [report, participantName, quizName, locale, showToast]);

  const handleSendEmail = useCallback(async () => {
    if (!report) return;
    const trimmed = emailAddress.trim();
    if (!trimmed) {
      setEmailError(locale === "fr" ? "Adresse email requise." : "Email address required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError(locale === "fr" ? "Adresse email invalide." : "Invalid email address.");
      return;
    }
    setEmailError(null);
    setIsSendingEmail(true);
    try {
      const blob = buildReportPdfBlob(report, { participantName, quizName }, locale);
      const pdfBase64 = await reportPdfBlobToBase64(blob);
      const result = await sendReportByEmailAction(
        quizId,
        participantId,
        trimmed,
        pdfBase64,
        locale
      );
      if (result.success) {
        setEmailDialogOpen(false);
        showToast(
          locale === "fr" ? t(locale, "dashboard.emailSent") : "Email sent successfully.",
          "success"
        );
      } else {
        const msg =
          result.error === "errors.unauthorized"
            ? t(locale, "errors.unauthorized")
            : result.error;
        setEmailError(msg);
      }
    } catch (_e) {
      setEmailError(
        locale === "fr"
          ? "Erreur lors de l'envoi de l'email."
          : "Error sending email."
      );
    } finally {
      setIsSendingEmail(false);
    }
  }, [
    report,
    emailAddress,
    quizId,
    participantId,
    participantName,
    quizName,
    locale,
    showToast,
  ]);

  const handleGenerate = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await generateQuizParticipantReportAction(quizId, participantId);
      if (result.success) {
        setReport(result.report);
        track(REPORT_GENERATED, {
          ...buildCommonEventProps({ isLoggedIn: true, preferredLanguage: locale }),
          quiz_id: quizId,
          participant_id: participantId,
          coins_spent: 4,
        });
        showToast(
          locale === "fr"
            ? "Rapport généré avec succès."
            : "Report generated successfully.",
          "success"
        );
      } else {
        const msg =
          result.error === "errors.unauthorized"
            ? t(locale, "errors.unauthorized")
            : result.error === "errors.insufficientCoins"
              ? t(locale, "errors.insufficientCoins")
              : result.error === "errors.coinDeductionFailed"
                ? t(locale, "errors.coinDeductionFailed")
                : result.error;
        setError(msg);
      }
    } catch (_e) {
      setError(
        locale === "fr"
          ? "Erreur lors de la génération du rapport."
          : "Error generating report."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (id: string) => {
    setOpenSection((prev) => (prev === id ? null : id));
  };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={backLink}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {locale === "fr" ? "Rapport IA participant" : "AI Participant Report"}
          </h1>
          <p className="text-muted-foreground">
            {participantName} · {quizName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {locale === "fr" ? "Statistiques" : "Statistics"}
          </CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Vue d'ensemble des tentatives (hors IA)."
              : "Overview of attempts (non-AI)."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-base">
          <p>
            {locale === "fr" ? "Nombre de questions : " : "Number of questions: "}
            <strong>{questionsCount}</strong>
          </p>
          <p>
            {locale === "fr" ? "Nombre de tentatives : " : "Number of attempts: "}
            <strong>{attemptsCount}</strong>
          </p>
          <p>
            {locale === "fr" ? "Ton solde de coins : " : "Your coin balance: "}
            <strong>{coinBalance}</strong>
            {isAdmin && (
              <span className="ml-2 text-muted-foreground">
                ({locale === "fr" ? "Admin : déduction possible même si solde insuffisant" : "Admin: deduction allowed even if balance insufficient"})
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {locale === "fr" ? "Générer un rapport IA" : "Generate AI Report"}
          </CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Rapport personnalisé : forces, faiblesses, erreurs récurrentes et plan d'étude 7 jours. Coût : 4 coins."
              : "Personalized report: strengths, weaknesses, recurring mistakes and 7-day study plan. Cost: 4 coins."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canGenerate && (
            <p className="text-sm text-amber-600 dark:text-amber-500">
              {locale === "fr"
                ? "Solde insuffisant (4 coins requis)."
                : "Insufficient balance (4 coins required)."}
              {" "}
              <Link href="/account/coins" className="underline font-medium">
                {locale === "fr" ? "Voir les offres" : "View offers"}
              </Link>
            </p>
          )}
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={!canGenerate || isLoading}
            isLoading={isLoading}
          >
            <Sparkles className="h-4 w-4" />
            {locale === "fr" ? "Générer le rapport (4 coins)" : "Generate report (4 coins)"}
          </Button>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="overflow-hidden border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="relative mb-6 flex items-end justify-center gap-2 h-12">
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 text-primary/30 animate-pulse" />
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="relative z-10 h-2 w-2 rounded-full bg-primary animate-bounce"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: "0.5s",
                  }}
                />
              ))}
            </div>
            <p className="text-lg font-semibold text-foreground mb-1">
              {locale === "fr" ? "L’IA analyse les réponses…" : "AI is analyzing answers…"}
            </p>
            <p className="text-sm text-muted-foreground max-w-sm">
              {locale === "fr"
                ? "Forces, faiblesses et plan d’étude en cours de préparation."
                : "Strengths, weaknesses and study plan are being prepared."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
              {locale === "fr" ? (
                <>
                  <span className="rounded-full bg-muted px-2 py-1">🧠 Révision des patterns</span>
                  <span className="rounded-full bg-muted px-2 py-1">✨ Synthèse en cours</span>
                  <span className="rounded-full bg-muted px-2 py-1">📅 Plan 7 jours</span>
                </>
              ) : (
                <>
                  <span className="rounded-full bg-muted px-2 py-1">🧠 Reviewing patterns</span>
                  <span className="rounded-full bg-muted px-2 py-1">✨ Building summary</span>
                  <span className="rounded-full bg-muted px-2 py-1">📅 7-day plan</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {report && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {locale === "fr" ? "Télécharger ou envoyer" : "Download or send"}
              </CardTitle>
              <CardDescription>
                {locale === "fr"
                  ? "Téléchargez le rapport en PDF ou envoyez-le par email."
                  : "Download the report as PDF or send it by email."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="h-4 w-4" />
                {locale === "fr" ? "Télécharger le PDF" : "Download PDF"}
              </Button>
              <Button variant="outline" onClick={openEmailDialog}>
                <Mail className="h-4 w-4" />
                {locale === "fr" ? "Envoyer par email" : "Send by email"}
              </Button>
            </CardContent>
          </Card>

          <ReportSection
            id="summary"
            title={locale === "fr" ? "Résumé" : "Summary"}
            icon={<Target className="h-4 w-4" />}
            open={openSection === "summary"}
            onToggle={() => toggleSection("summary")}
          >
            <div className="space-y-2">
              <p className="font-medium capitalize">{report.summary.overallLevel}</p>
              <p>{report.summary.oneSentence}</p>
              <ul className="list-disc list-inside text-muted-foreground">
                {report.summary.keyNumbers.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          </ReportSection>

          <ReportSection
            id="strengths"
            title={locale === "fr" ? "Forces" : "Strengths"}
            icon={<Lightbulb className="h-4 w-4" />}
            open={openSection === "strengths"}
            onToggle={() => toggleSection("strengths")}
          >
            <ul className="space-y-3">
              {report.strengths.map((s, i) => (
                <li key={i} className="border-l-2 border-primary pl-3">
                  <strong>{s.title}</strong>
                  <p className="text-muted-foreground text-sm">{s.evidence}</p>
                  <p className="text-xs text-muted-foreground">{s.metric}</p>
                </li>
              ))}
            </ul>
          </ReportSection>

          <ReportSection
            id="weaknesses"
            title={locale === "fr" ? "Faiblesses" : "Weaknesses"}
            icon={<AlertTriangle className="h-4 w-4" />}
            open={openSection === "weaknesses"}
            onToggle={() => toggleSection("weaknesses")}
          >
            <ul className="space-y-3">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="border-l-2 border-amber-500 pl-3">
                  <strong>{w.title}</strong>
                  <p className="text-muted-foreground text-sm">{w.evidence}</p>
                  <p className="text-xs text-muted-foreground">{w.metric}</p>
                </li>
              ))}
            </ul>
          </ReportSection>

          <ReportSection
            id="recurring"
            title={locale === "fr" ? "Erreurs récurrentes" : "Recurring mistakes"}
            icon={<BookOpen className="h-4 w-4" />}
            open={openSection === "recurring"}
            onToggle={() => toggleSection("recurring")}
          >
            <ul className="space-y-4">
              {report.recurringMistakes.map((m, i) => (
                <li key={i} className="rounded-lg border p-3">
                  <p className="font-medium">{m.pattern}</p>
                  <p className="text-sm text-muted-foreground">{m.whyLikely}</p>
                  <p className="text-sm mt-1">
                    <strong>{locale === "fr" ? "Comment corriger : " : "How to fix: "}</strong>
                    {m.howToFix}
                  </p>
                </li>
              ))}
            </ul>
          </ReportSection>

          <ReportSection
            id="review"
            title={locale === "fr" ? "Questions à revoir" : "Questions to review"}
            icon={<BookOpen className="h-4 w-4" />}
            open={openSection === "review"}
            onToggle={() => toggleSection("review")}
          >
            <ul className="space-y-4">
              {report.mostImportantQuestionsToReview.map((q, i) => (
                <li key={i} className="rounded-lg border p-3">
                  <p className="font-medium">{q.question}</p>
                  <p className="text-sm text-muted-foreground">{q.whyMissed}</p>
                  <p className="text-sm mt-1">
                    <strong>{locale === "fr" ? "À retenir : " : "Remember: "}</strong>
                    {q.whatToRemember}
                  </p>
                </li>
              ))}
            </ul>
          </ReportSection>

          <ReportSection
            id="plan"
            title={locale === "fr" ? "Plan d'étude 7 jours" : "7-day study plan"}
            icon={<Calendar className="h-4 w-4" />}
            open={openSection === "plan"}
            onToggle={() => toggleSection("plan")}
          >
            <ol className="space-y-3">
              {report.studyPlan7Days.map((day, i) => (
                <li key={i} className="rounded-lg border p-3">
                  <strong>
                    {locale === "fr" ? "Jour " : "Day "}
                    {day.day} : {day.focus}
                  </strong>
                  <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
                    {day.tasks.map((t, j) => (
                      <li key={j}>{t}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </ReportSection>

          {report.tips.length > 0 && (
            <ReportSection
              id="tips"
              title={locale === "fr" ? "Conseils" : "Tips"}
              icon={<Lightbulb className="h-4 w-4" />}
              open={openSection === "tips"}
              onToggle={() => toggleSection("tips")}
            >
              <ul className="list-disc list-inside space-y-1">
                {report.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </ReportSection>
          )}

          {report.warnings.length > 0 && (
            <div className="rounded-lg border border-amber-500/50 bg-amber-500/5 p-4">
              <h3 className="font-semibold flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                {locale === "fr" ? "Points d'attention" : "Warnings"}
              </h3>
              <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
                {report.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {locale === "fr" ? "Envoyer le rapport par email" : "Send report by email"}
            </DialogTitle>
            <DialogDescription>
              {locale === "fr"
                ? "Le rapport PDF sera envoyé en pièce jointe à l'adresse indiquée."
                : "The report PDF will be sent as an attachment to the given address."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="report-email">
                {locale === "fr" ? "Adresse email" : "Email address"}
              </Label>
              <Input
                id="report-email"
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                disabled={isSendingEmail}
              />
              {participantEmail && (
                <p className="text-xs text-muted-foreground">
                  {locale === "fr"
                    ? "Prérempli avec l'email du participant."
                    : "Prefilled with participant email."}
                </p>
              )}
              {emailError && (
                <p className="text-sm text-destructive">{emailError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmailDialogOpen(false)}
              disabled={isSendingEmail}
            >
              {locale === "fr" ? "Annuler" : "Cancel"}
            </Button>
            <Button
              variant="primary"
              onClick={handleSendEmail}
              disabled={isSendingEmail}
              isLoading={isSendingEmail}
            >
              {isSendingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              {locale === "fr" ? "Envoyer" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReportSection({
  id: _id,
  title,
  icon,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left font-semibold hover:bg-muted/50 rounded-t-lg transition-colors"
        onClick={onToggle}
      >
        <span className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          {icon}
          {title}
        </span>
      </button>
      {open && <CardContent className="pt-0">{children}</CardContent>}
    </Card>
  );
}
