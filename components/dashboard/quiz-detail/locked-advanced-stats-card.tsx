"use client";

import { BarChart3, Lock } from "lucide-react";

import { PlayfulSectionTitle } from "@/components/ui/playful-section-title";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

const FEATURE_KEYS = [
  "dashboard.lockedAdvancedStats.questionAnalysis",
  "dashboard.lockedAdvancedStats.hardestQuestions",
  "dashboard.lockedAdvancedStats.averageTime",
  "dashboard.lockedAdvancedStats.answerDistribution",
  "dashboard.lockedAdvancedStats.exportSoon",
] as const;

/** Decorative bar heights in px — fixed placeholders, not derived from quiz data. */
const PLACEHOLDER_BAR_HEIGHTS = [36, 24, 44, 30] as const;

function PlaceholderMiniChart({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
      <div className="mb-2 h-2 w-16 rounded bg-muted-foreground/20" />
      <div className="flex h-14 items-end gap-1.5">
        {PLACEHOLDER_BAR_HEIGHTS.map((heightPx, index) => (
          <div
            key={`${label}-bar-${index}`}
            className="flex-1 rounded-sm bg-muted-foreground/25"
            style={{ height: `${heightPx}px` }}
          />
        ))}
      </div>
    </div>
  );
}

/** Decorative chart placeholders with a light blur (same approach as locked attempts). */
function LockedAdvancedStatsBlurPreview() {
  return (
    <div
      data-testid="locked-advanced-stats-blur-layer"
      className="overflow-hidden"
      aria-hidden
    >
      <div className="pointer-events-none select-none opacity-90 [filter:blur(3px)]">
        <div className="grid gap-3 sm:grid-cols-3">
          <PlaceholderMiniChart label="distribution" />
          <PlaceholderMiniChart label="difficulty" />
          <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
            <div className="mb-2 h-2 w-20 rounded bg-muted-foreground/20" />
            <div className="relative mx-auto h-14 w-14 rounded-full border-4 border-muted-foreground/20">
              <div className="absolute inset-2 rounded-full bg-muted-foreground/15" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type LockedAdvancedStatsCardProps = {
  onUnlockClick: () => void;
};

/**
 * Teaser for advanced analytics (free tier). No stats props — never receives real data.
 */
export function LockedAdvancedStatsCard({ onUnlockClick }: LockedAdvancedStatsCardProps) {
  const { locale } = useLocale();

  return (
    <section
      data-testid="locked-advanced-stats-card"
      className="rounded-xl border border-dashed border-border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
            <PlayfulSectionTitle as="h3" className="text-xl font-semibold text-foreground">
              {t(locale, "dashboard.lockedAdvancedStats.title")}
            </PlayfulSectionTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(locale, "dashboard.lockedAdvancedStats.description")}
          </p>
          <ul className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
            {FEATURE_KEYS.map((key) => (
              <li key={key} className="flex items-center gap-2">
                <Lock className="h-3 w-3 shrink-0 opacity-60" aria-hidden />
                {t(locale, key)}
              </li>
            ))}
          </ul>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full shrink-0 sm:w-auto sm:self-start"
          onClick={onUnlockClick}
        >
          {t(locale, "dashboard.unlockDialog.unlockStats")}
        </Button>
      </div>

      <div className="relative mt-4" data-testid="locked-advanced-stats-preview">
        <LockedAdvancedStatsBlurPreview />
      </div>
    </section>
  );
}
