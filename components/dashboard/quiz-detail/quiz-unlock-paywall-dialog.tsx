"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { unlockQuizWithCoinsAction } from "@/app/(app)/dashboard/quiz/[quizId]/unlock-actions";
import { createProSubscriptionCheckoutAction } from "@/app/(app)/account/pro-subscription/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { UNLOCK_QUIZ_ERROR } from "@/lib/quiz/quizUnlockConstants";
import { PRO_MONTHLY_PRICE_EUR } from "@/lib/subscription/proSubscriptionConstants";
import { cn } from "@/lib/utils";

export type QuizUnlockPaywallContext = "default" | "extend" | "reactivate";

export type QuizUnlockPaywallDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quizId: string;
  coinBalance: number;
  unlockCost: number;
  isUnlocking: boolean;
  onUnlockWithCoins: () => Promise<void>;
  buyCoinsHref: string;
  isProAvailable?: boolean;
  isStartingProCheckout?: boolean;
  onStartProCheckout?: () => Promise<void> | void;
  context?: QuizUnlockPaywallContext;
};

export type QuizDetailPaywallControls = {
  open: boolean;
  setOpen: (open: boolean) => void;
  isUnlocking: boolean;
  buyCoinsHref: string;
  handleUnlockWithCoins: () => Promise<void>;
  isStartingProCheckout: boolean;
  handleStartProCheckout: () => Promise<void>;
};

const paywallButtonClassName =
  "h-auto min-h-11 w-full whitespace-normal py-3 text-center normal-case tracking-normal";

type PaywallOptionProps = {
  title: string;
  price: ReactNode;
  priceSuffix?: string;
  muted?: boolean;
  children: ReactNode;
};

function PaywallOption({ title, price, priceSuffix, muted = false, children }: PaywallOptionProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-4 sm:p-5",
        muted && "border-dashed bg-muted/20 opacity-90",
      )}
    >
      <h3 className="text-base font-semibold leading-snug text-foreground sm:text-lg">{title}</h3>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
        {price}
        {priceSuffix ? (
          <span className="text-sm font-medium text-muted-foreground">{priceSuffix}</span>
        ) : null}
      </div>
      <div className="mt-4 flex flex-col gap-2">{children}</div>
    </section>
  );
}

export function QuizUnlockPaywallDialog({
  open,
  onOpenChange,
  coinBalance,
  unlockCost,
  isUnlocking,
  onUnlockWithCoins,
  buyCoinsHref,
  isProAvailable = false,
  isStartingProCheckout = false,
  onStartProCheckout,
  context = "default",
}: QuizUnlockPaywallDialogProps) {
  const { locale } = useLocale();
  const hasEnoughCoins = coinBalance >= unlockCost;
  const missingCoins = Math.max(0, unlockCost - coinBalance);

  const dialogTitle =
    context === "default"
      ? t(locale, "dashboard.unlockDialog.simpleTitle")
      : t(locale, "dashboard.unlockDialog.extendTitle");

  const dialogDescription =
    context === "reactivate"
      ? t(locale, "dashboard.unlockDialog.extendDescriptionExpired")
      : context === "extend"
        ? t(locale, "dashboard.unlockDialog.extendDescriptionActive")
        : null;

  const coinUnlockLabel =
    context === "reactivate"
      ? t(locale, "dashboard.unlockDialog.reactivateCoinOption")
      : context === "extend"
        ? t(locale, "dashboard.unlockDialog.extendCoinOption")
        : t(locale, "dashboard.unlockPaywall.unlockButton");

  const proButtonLabel = isProAvailable
    ? t(locale, "dashboard.unlockDialog.upgradeToPro")
    : t(locale, "dashboard.unlockDialog.proSoon");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[calc(100%-1.5rem)] max-w-md rounded-xl sm:max-w-md"
        data-testid="quiz-unlock-paywall-dialog"
      >
        <DialogHeader className="pr-8 text-left">
          <DialogTitle>{dialogTitle}</DialogTitle>
          {dialogDescription ? (
            <DialogDescription className="text-pretty">{dialogDescription}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <PaywallOption
            title={t(locale, "dashboard.unlockPaywall.singleQuizLabel")}
            price={
              <span className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">
                {unlockCost} coins
              </span>
            }
          >
            {hasEnoughCoins ? (
              <Button
                type="button"
                variant="blue"
                className={paywallButtonClassName}
                disabled={isUnlocking}
                onClick={() => void onUnlockWithCoins()}
              >
                {isUnlocking ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                {coinUnlockLabel}
              </Button>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {t(locale, "dashboard.unlockPaywall.missingCoins", {
                    coins: String(missingCoins),
                  })}
                </p>
                <Button type="button" variant="blue" className={paywallButtonClassName} asChild>
                  <Link href={buyCoinsHref}>{t(locale, "dashboard.unlockDialog.buyCoins")}</Link>
                </Button>
              </>
            )}
          </PaywallOption>

          <PaywallOption
            title={t(locale, "dashboard.unlockPaywall.allQuizzesTitle")}
            muted={!isProAvailable}
            price={
              isProAvailable ? (
                <span className="text-2xl font-bold tabular-nums text-primary sm:text-3xl">
                  {PRO_MONTHLY_PRICE_EUR}€
                </span>
              ) : (
                <span className="text-xl font-semibold text-muted-foreground">
                  {t(locale, "dashboard.soonBadge")}
                </span>
              )
            }
            priceSuffix={isProAvailable ? t(locale, "account.subscription.perMonth") : undefined}
          >
            <Button
              type="button"
              variant={isProAvailable ? "primary" : "outline"}
              className={paywallButtonClassName}
              data-testid="quiz-unlock-pro-checkout"
              disabled={!isProAvailable || isStartingProCheckout}
              onClick={() => {
                if (!isProAvailable || isStartingProCheckout) return;
                void onStartProCheckout?.();
              }}
            >
              {isStartingProCheckout ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {!isStartingProCheckout ? proButtonLabel : null}
            </Button>
          </PaywallOption>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type UseQuizUnlockPaywallDialogOptions = {
  quizId: string;
  coinBalance: number;
  unlockCost: number;
  isProAvailable: boolean;
};

export function useQuizUnlockPaywallDialog({
  quizId,
  coinBalance,
  unlockCost,
  isProAvailable,
}: UseQuizUnlockPaywallDialogOptions) {
  const { locale } = useLocale();
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isStartingProCheckout, setIsStartingProCheckout] = useState(false);

  const buyCoinsHref = `/account/coins?returnTo=${encodeURIComponent(`/dashboard/quiz/${quizId}`)}&reason=unlock_quiz`;

  const handleUnlockWithCoins = async () => {
    if (coinBalance < unlockCost || isUnlocking) {
      return;
    }

    setIsUnlocking(true);
    try {
      const result = await unlockQuizWithCoinsAction(quizId);
      if (!result.success) {
        const missingCoins = Math.max(0, unlockCost - coinBalance);
        const message =
          result.error === UNLOCK_QUIZ_ERROR.INSUFFICIENT_COINS
            ? t(locale, "dashboard.unlockPaywall.missingCoins", {
                coins: String(missingCoins),
              })
            : t(locale, "dashboard.unlockPaywall.error");
        showToast(message, "error");
        return;
      }

      if (result.alreadyUnlocked) {
        showToast(t(locale, "dashboard.unlockPaywall.alreadyUnlocked"), "success");
      } else {
        showToast(t(locale, "dashboard.unlockPaywall.success"), "success");
      }
      setOpen(false);
      router.refresh();
    } catch {
      showToast(t(locale, "dashboard.unlockPaywall.error"), "error");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleStartProCheckout = async () => {
    if (!isProAvailable || isStartingProCheckout) return;
    setIsStartingProCheckout(true);
    try {
      const result = await createProSubscriptionCheckoutAction();
      if (!result.success) {
        if (result.redirectTo) {
          router.push(result.redirectTo);
          router.refresh();
        }
        showToast(t(locale, "account.subscription.checkoutError"), "error");
        return;
      }

      window.location.assign(result.checkoutUrl);
    } catch {
      showToast(t(locale, "account.subscription.checkoutError"), "error");
    } finally {
      setIsStartingProCheckout(false);
    }
  };

  return {
    open,
    setOpen,
    isUnlocking,
    buyCoinsHref,
    handleUnlockWithCoins,
    isStartingProCheckout,
    handleStartProCheckout,
  };
}
