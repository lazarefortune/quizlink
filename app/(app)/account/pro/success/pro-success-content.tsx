"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Coins, Loader2, Sparkles } from "lucide-react";

import { ManageProSubscriptionButton } from "@/app/(app)/account/manage-pro-subscription-button";
import {
  getProCheckoutSessionDetails,
  getProSubscriptionAccessAction,
} from "@/app/(app)/account/pro-subscription/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ActiveUserSubscriptionAccess } from "@/lib/quiz/getActiveUserSubscriptionAccess";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { PRO_MONTHLY_INCLUDED_COINS } from "@/lib/subscription/proSubscriptionConstants";
import { fireCelebrationConfetti } from "@/lib/ui/celebration-confetti";

const SUCCESS_BENEFIT_KEYS = [
  "account.subscription.allQuizzesUnlocked",
  "account.subscription.advancedStatsAvailable",
  "account.subscription.monthlyCoinsIncluded",
] as const;

const INITIAL_WAIT_MS = 3000;
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 15;

type ProSuccessView = "verifying" | "invalid" | "activating" | "success";

type ProSuccessContentProps = {
  sessionId: string | null;
  initialProAccess: ActiveUserSubscriptionAccess;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ProSuccessContent({
  sessionId,
  initialProAccess,
}: ProSuccessContentProps) {
  const { locale } = useLocale();
  const hasFiredConfetti = useRef(false);
  const hasStartedVerification = useRef(false);

  const [view, setView] = useState<ProSuccessView>(() =>
    initialProAccess.isActive ? "success" : "verifying",
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tryResolveProAccess = useCallback(async (): Promise<boolean> => {
    const accessResult = await getProSubscriptionAccessAction();
    if (!accessResult.success) {
      return false;
    }
    return accessResult.access.isActive;
  }, []);

  const runActivationPoll = useCallback(async () => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
      const isActive = await tryResolveProAccess();
      if (isActive) {
        setView("success");
        return;
      }
      if (attempt < MAX_POLL_ATTEMPTS - 1) {
        await sleep(POLL_INTERVAL_MS);
      }
    }
    setView("activating");
  }, [tryResolveProAccess]);

  useEffect(() => {
    if (hasStartedVerification.current) {
      return;
    }
    hasStartedVerification.current = true;

    const verify = async () => {
      if (initialProAccess.isActive) {
        setView("success");
        return;
      }

      if (!sessionId) {
        setView("invalid");
        return;
      }

      const details = await getProCheckoutSessionDetails(sessionId);
      if (!details.success) {
        setView("invalid");
        return;
      }
      if (!details.isValid) {
        setView("invalid");
        return;
      }

      await sleep(INITIAL_WAIT_MS);
      await runActivationPoll();
    };

    void verify();
  }, [initialProAccess.isActive, runActivationPoll, sessionId]);

  useEffect(() => {
    if (view !== "success" || hasFiredConfetti.current) {
      return;
    }
    hasFiredConfetti.current = true;
    fireCelebrationConfetti();
  }, [view]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const isActive = await tryResolveProAccess();
      if (isActive) {
        setView("success");
        return;
      }
      await runActivationPoll();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md" data-testid="pro-success-page-card">
        <CardHeader className="text-center">
          {view === "verifying" ? (
            <>
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" aria-hidden />
              <CardTitle>{t(locale, "account.subscription.proSuccessLoading")}</CardTitle>
              <CardDescription>
                {t(locale, "account.subscription.activatingDescription")}
              </CardDescription>
            </>
          ) : null}

          {view === "invalid" ? (
            <>
              <CardTitle>{t(locale, "account.subscription.invalidSession")}</CardTitle>
              <CardDescription>
                {t(locale, "account.subscription.activatingDescription")}
              </CardDescription>
            </>
          ) : null}

          {view === "activating" ? (
            <>
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" aria-hidden />
              <CardTitle>{t(locale, "account.subscription.activatingTitle")}</CardTitle>
              <CardDescription>
                {t(locale, "account.subscription.activatingDescription")}
              </CardDescription>
            </>
          ) : null}

          {view === "success" ? (
            <>
              <CheckCircle2
                className="mx-auto mb-4 h-12 w-12 text-green-600 dark:text-green-400"
                aria-hidden
              />
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden />
                <CardTitle>{t(locale, "account.subscription.successTitle")}</CardTitle>
              </div>
              <CardDescription>
                {t(locale, "account.subscription.successDescription")}
              </CardDescription>
            </>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-4">
          {view === "success" ? (
            <>
              <ul
                className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-4"
                data-testid="pro-success-benefits"
              >
                {SUCCESS_BENEFIT_KEYS.map((key) => (
                  <li key={key} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>
                      {t(
                        locale,
                        key,
                        key === "account.subscription.monthlyCoinsIncluded"
                          ? { coins: PRO_MONTHLY_INCLUDED_COINS }
                          : undefined,
                      )}
                    </span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{t(locale, "dashboard.unlockDialog.proScopeHint")}</span>
                </li>
              </ul>

              <div className="flex flex-col gap-2">
                <Button variant="blue" asChild className="w-full">
                  <Link href="/dashboard/quizzes">
                    {t(locale, "account.subscription.viewQuizzes")}
                  </Link>
                </Button>
                <ManageProSubscriptionButton variant="outline" className="w-full" />
                <Button variant="secondary" asChild className="w-full gap-1.5">
                  <Link href="/account/coins">
                    <Coins className="h-4 w-4" aria-hidden />
                    {t(locale, "account.coins.title")}
                  </Link>
                </Button>
              </div>
            </>
          ) : null}

          {view === "activating" ? (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={isRefreshing}
                onClick={() => void handleRefresh()}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                {t(locale, "account.subscription.refreshStatus")}
              </Button>
              <Button variant="secondary" asChild className="w-full">
                <Link href="/account">{t(locale, "account.subscription.backToAccount")}</Link>
              </Button>
            </div>
          ) : null}

          {view === "invalid" ? (
            <Button variant="secondary" asChild className="w-full">
              <Link href="/account">{t(locale, "account.subscription.backToAccount")}</Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
