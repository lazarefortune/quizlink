"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

import { useManageProSubscription } from "./use-manage-pro-subscription";

type ManageProSubscriptionButtonProps = {
  variant?: "default" | "blue" | "outline" | "secondary";
  className?: string;
  size?: "default" | "sm" | "lg";
};

export function ManageProSubscriptionButton({
  variant = "outline",
  className,
  size = "default",
}: ManageProSubscriptionButtonProps) {
  const { locale } = useLocale();
  const { isOpeningPortal, openBillingPortal } = useManageProSubscription();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      data-testid="manage-pro-subscription-button"
      disabled={isOpeningPortal}
      onClick={() => void openBillingPortal()}
    >
      {isOpeningPortal ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {t(locale, "account.subscription.manageSubscription")}
    </Button>
  );
}
