"use client";

import { useState } from "react";

import { createStripeBillingPortalSessionAction } from "@/app/(app)/account/pro-subscription/actions";
import { useToast } from "@/components/ui/toast";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

export function useManageProSubscription() {
  const { locale } = useLocale();
  const { showToast } = useToast();
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const openBillingPortal = async () => {
    if (isOpeningPortal) return;
    setIsOpeningPortal(true);
    try {
      const result = await createStripeBillingPortalSessionAction();
      if (!result.success) {
        showToast(t(locale, "account.subscription.portalError"), "error");
        return;
      }
      window.location.assign(result.portalUrl);
    } catch {
      showToast(t(locale, "account.subscription.portalError"), "error");
    } finally {
      setIsOpeningPortal(false);
    }
  };

  return { isOpeningPortal, openBillingPortal };
}
