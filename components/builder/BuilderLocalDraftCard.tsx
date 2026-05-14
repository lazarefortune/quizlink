"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { clearBuilderDraftAndIndexEntry, type BuilderDraftIndexEntry } from "@/lib/builder/builderLocalDraft";
import { getFirstVisibleBuilderDraftIndexEntry } from "@/lib/builder/filterLocalDraftForDashboard";
import { formatBuilderDraftRelativeSavedAt } from "@/lib/builder/formatBuilderDraftRelativeSavedAt";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

type BuilderLocalDraftCardProps = {
  userId: string;
  /** Server DRAFT quiz ids: hide local recovery row when scope matches (recovery stays in builder). */
  serverDraftQuizIds?: readonly string[];
};

export function BuilderLocalDraftCard({
  userId,
  serverDraftQuizIds = [],
}: BuilderLocalDraftCardProps) {
  const { locale } = useLocale();
  const [refreshToken, setRefreshToken] = useState(0);
  const [entry, setEntry] = useState<BuilderDraftIndexEntry | null>(null);

  const reload = useCallback(() => {
    setEntry(getFirstVisibleBuilderDraftIndexEntry(userId, serverDraftQuizIds));
  }, [userId, serverDraftQuizIds]);

  useEffect(() => {
    reload();
  }, [reload, refreshToken]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!e.key?.startsWith("quizsnap:builder-draft")) {
        return;
      }
      setRefreshToken((n) => n + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const bumpRefresh = () => {
    setRefreshToken((n) => n + 1);
  };

  if (!entry) {
    return null;
  }

  const displayName = entry.quizName || t(locale, "dashboard.localDraft.untitledQuiz");
  const relativeTime = formatBuilderDraftRelativeSavedAt(
    entry.savedAt,
    locale === "fr" ? "fr" : "en",
  );
  const continueHref = `${entry.targetRoute}?restoreDraft=1`;

  const handleDelete = () => {
    clearBuilderDraftAndIndexEntry(
      userId,
      entry.scope === "new" ? "new" : entry.scope,
    );
    bumpRefresh();
  };

  return (
    <Card className="border border-amber-500/35 bg-amber-500/[0.06]">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-base font-semibold text-foreground">
            {t(locale, "dashboard.localDraft.cardTitle")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(locale, "dashboard.localDraft.cardDescription")}
          </p>
          <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {t(locale, "dashboard.localDraft.cardMeta", {
              questionCount: entry.questionCount,
              relativeTime,
            })}
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button variant="blue" asChild size="sm" className="w-full sm:w-auto">
            <Link href={continueHref}>{t(locale, "dashboard.localDraft.recover")}</Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={handleDelete}
          >
            {t(locale, "dashboard.localDraft.delete")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
