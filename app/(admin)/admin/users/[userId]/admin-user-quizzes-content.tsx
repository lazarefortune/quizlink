"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Coins,
  ExternalLink,
  FileQuestion,
  FileText,
  Link2,
  User,
  Users,
  Target,
  Copy,
} from "lucide-react";
import { useLocale } from "@/lib/i18n/use-locale";
import { t, type Locale } from "@/lib/i18n";
import { useToast } from "@/components/ui/toast";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import type {
  AdminQuizDetail,
  AdminParticipant,
} from "../../actions";

type UserInfo = {
  id: string;
  name: string;
  email: string;
  role: string;
  coinBalance: number;
  createdAt: Date;
};

type AdminUserQuizzesContentProps = {
  user: UserInfo;
  quizzes: AdminQuizDetail[];
  participants: AdminParticipant[];
};

export function AdminUserQuizzesContent({
  user,
  quizzes,
  participants,
}: AdminUserQuizzesContentProps) {
  const { locale } = useLocale();
  const { showToast } = useToast();
  const dateLocale = locale === "fr" ? fr : enUS;

  const totalResponses = quizzes.reduce((s, q) => s + q.totalResponsesCount, 0);
  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(locale === "fr" ? "Copié !" : "Copied!", "success");
  };

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href="/admin" className="text-muted-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {t(locale, "admin.userQuizzes.backToDashboard")}
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {t(locale, "admin.userQuizzes.title")}
          </h1>
        </div>

        {/* User card */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue/10 text-blue">
                <User className="h-5 w-5" />
              </div>
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
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatMini
                icon={<FileText className="h-4 w-4" />}
                label="Quiz"
                value={quizzes.length}
              />
              <StatMini
                icon={<Users className="h-4 w-4" />}
                label="Participants"
                value={participants.length}
              />
              <StatMini
                icon={<Target className="h-4 w-4" />}
                label={t(locale, "admin.userQuizzes.responsesStat")}
                value={totalResponses}
              />
              <StatMini
                icon={<Coins className="h-4 w-4 text-primary" />}
                label="Coins"
                value={user.coinBalance}
              />
            </div>
          </CardContent>
        </Card>

        {/* Quizzes section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Quiz ({quizzes.length})
          </h2>

          {quizzes.length === 0 ? (
            <Card className="border border-border border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                {t(locale, "admin.userQuizzes.noQuizzes")}
              </CardContent>
            </Card>
          ) : (
            quizzes.map((quiz) => (
              <QuizExpandable
                key={quiz.id}
                quiz={quiz}
                locale={locale}
                dateLocale={dateLocale}
                baseUrl={baseUrl}
                onCopy={handleCopy}
              />
            ))
          )}
        </div>

        {/* Participants section */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Participants ({participants.length})
          </h2>

          {participants.length === 0 ? (
            <Card className="border border-border border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                {locale === "fr"
                  ? "Aucun participant ajouté"
                  : "No participants added"}
              </CardContent>
            </Card>
          ) : (
            participants.map((p) => (
              <ParticipantExpandable
                key={p.id}
                participant={p}
                locale={locale}
                dateLocale={dateLocale}
                baseUrl={baseUrl}
                onCopy={handleCopy}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function StatMini({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border p-2.5">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
        <p className="text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function QuizExpandable({
  quiz,
  locale,
  dateLocale,
  baseUrl,
  onCopy,
}: {
  quiz: AdminQuizDetail;
  locale: Locale;
  dateLocale: typeof fr;
  baseUrl: string;
  onCopy: (text: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"links" | "questions">("links");

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header row */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{quiz.name}</p>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileQuestion className="h-3 w-3" />
                {quiz.questionsCount}
              </span>
              <span className="flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {quiz.linksCount}
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {quiz.totalResponsesCount}
              </span>
              <span>
                {format(new Date(quiz.createdAt), "dd MMM yyyy", {
                  locale: dateLocale,
                })}
              </span>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Badge variant="secondary">
              {quiz.visibility === "PUBLIC"
                ? locale === "fr"
                  ? "Public"
                  : "Public"
                : locale === "fr"
                  ? "Privé"
                  : "Private"}
            </Badge>
            {quiz.isAnonymous && <Badge variant="outline">Anonyme</Badge>}
          </div>
        </button>

        {/* Expanded content */}
        {isOpen && (
          <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
            {/* External link */}
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" asChild>
                <Link
                  href={`/dashboard/quiz/${quiz.id}`}
                  target="_blank"
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {locale === "fr" ? "Ouvrir le quiz" : "Open quiz"}
                </Link>
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border">
              <button
                type="button"
                onClick={() => setTab("links")}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === "links"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {locale === "fr" ? "Liens" : "Links"} ({quiz.links.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("questions")}
                className={`px-3 py-1.5 text-sm font-medium border-b-2 transition-colors ${
                  tab === "questions"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Questions ({quiz.questions.length})
              </button>
            </div>

            {/* Tab content */}
            {tab === "links" && (
              <div className="space-y-2">
                {quiz.links.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {locale === "fr" ? "Aucun lien" : "No links"}
                  </p>
                ) : (
                  quiz.links.map((link) => {
                    const url = `${baseUrl}/quiz/${link.token}`;
                    return (
                      <div
                        key={link.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-border p-3 text-sm"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium text-muted-foreground">
                              {locale === "fr" ? "Lien public" : "Public link"}
                            </span>
                            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                              {url}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => onCopy(url)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {link.participantName && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {link.participantName}
                              </span>
                            )}
                            <span>
                              {link.totalResponsesCount}{" "}
                              {locale === "fr"
                                ? link.totalResponsesCount <= 1
                                  ? t(locale, "admin.userQuizzes.responseSingular")
                                  : t(locale, "admin.userQuizzes.responsePlural")
                                : link.totalResponsesCount === 1
                                  ? t(locale, "admin.userQuizzes.responseSingular")
                                  : t(locale, "admin.userQuizzes.responsePlural")}
                            </span>
                            {link.revokedAt && (
                              <Badge
                                variant="destructive"
                                className="text-[10px] px-1.5 py-0"
                              >
                                {locale === "fr" ? "Révoqué" : "Revoked"}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          asChild
                        >
                          <Link href={url} target="_blank">
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            {locale === "fr" ? "Ouvrir" : "Open"}
                          </Link>
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {tab === "questions" && (
              <div className="space-y-1">
                {quiz.questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {locale === "fr"
                      ? "Aucune question"
                      : "No questions"}
                  </p>
                ) : (
                  quiz.questions.map((q, i) => (
                    <div
                      key={q.id}
                      className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2">
                          {q.label.replace(/<[^>]+>/g, " ").trim()}
                        </p>
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-[10px]">
                            {q.type}
                          </Badge>
                          <span>
                            {q.optionsCount}{" "}
                            {locale === "fr" ? "options" : "options"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ParticipantExpandable({
  participant,
  locale,
  dateLocale: _dateLocale,
  baseUrl,
  onCopy,
}: {
  participant: AdminParticipant;
  locale: Locale;
  dateLocale: typeof fr;
  baseUrl: string;
  onCopy: (text: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <CardContent className="p-0">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{participant.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {participant.email ?? (locale === "fr" ? "Pas d'email" : "No email")}
            </p>
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground shrink-0">
            <span className="flex items-center gap-1">
              <Link2 className="h-3 w-3" />
              {participant.linksCount}
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {participant.totalResponsesCount}
            </span>
          </div>
        </button>

        {isOpen && (
          <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
            <p className="text-xs text-muted-foreground mb-2">
              {locale === "fr" ? "Quiz inscrits" : "Enrolled quizzes"} (
              {participant.links.length})
            </p>
            {participant.links.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {locale === "fr"
                  ? "Aucun quiz inscrit"
                  : "Not enrolled in any quiz"}
              </p>
            ) : (
              participant.links.map((link) => {
                const url = `${baseUrl}/quiz/${link.token}`;
                return (
                  <div
                    key={link.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-border p-3 text-sm"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium truncate">{link.quizName}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-muted-foreground">
                          {locale === "fr" ? "Lien public" : "Public link"}
                        </span>
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded break-all">
                          {url}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => onCopy(url)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span>
                          {link.totalResponsesCount}{" "}
                          {locale === "fr"
                            ? link.totalResponsesCount <= 1
                              ? t(locale, "admin.userQuizzes.responseSingular")
                              : t(locale, "admin.userQuizzes.responsePlural")
                            : link.totalResponsesCount === 1
                              ? t(locale, "admin.userQuizzes.responseSingular")
                              : t(locale, "admin.userQuizzes.responsePlural")}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      asChild
                    >
                      <Link href={url} target="_blank">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" />
                        {locale === "fr" ? "Ouvrir" : "Open"}
                      </Link>
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

