"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

import { useCookieConsent } from "./cookie-consent-context";

export function CookieConsentBanner() {
  const { consent, isHydrated, updateConsent, openConsentPanel, isPanelOpen } =
    useCookieConsent();
  const { locale } = useLocale();

  const mustShowCookieModal =
    isHydrated && !consent.hasRecordedChoice && !isPanelOpen;

  if (!isHydrated || !mustShowCookieModal) {
    return null;
  }

  return (
    <Dialog open={true} modal>
      <DialogContent
        blocking
        hideCloseButton
        className="gap-6 border-2 border-border p-6 shadow-2xl sm:max-w-lg sm:p-8"
      >
        <DialogHeader className="space-y-3 text-left">
          <DialogTitle className="text-xl font-semibold leading-snug sm:text-2xl">
            {t(locale, "cookieConsent.banner.title")}
            <BrandQuizLinkText className="inline" />
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            {t(locale, "cookieConsent.banner.description")}
          </DialogDescription>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t(locale, "cookieConsent.banner.changeHint")}
          </p>
        </DialogHeader>

        <DialogFooter className="flex-col gap-5 sm:flex-col sm:space-x-0">
          <Button
            type="button"
            variant="primary"
            size="default"
            className="w-full"
            onClick={() => {
              updateConsent({
                hasRecordedChoice: true,
                analytics: true,
                sessionReplay: true,
              });
            }}
          >
            {t(locale, "cookieConsent.banner.acceptAll")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="default"
            className="w-full"
            onClick={() => openConsentPanel()}
          >
            {t(locale, "cookieConsent.banner.customize")}
          </Button>
        </DialogFooter>

        <div className="border-t border-border/50 pt-4">
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-center px-2 text-center text-[11px] font-normal leading-snug text-muted-foreground/60 transition-colors hover:text-muted-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:text-xs"
            onClick={() => {
              updateConsent({
                hasRecordedChoice: true,
                analytics: false,
                sessionReplay: false,
              });
            }}
          >
            {t(locale, "cookieConsent.banner.rejectOptional")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
