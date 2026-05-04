"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { useCookieConsent } from "./cookie-consent-context";
import { cn } from "@/lib/utils";

function CategoryBlock({
  title,
  description,
  examples,
  children,
}: {
  title: string;
  description: string;
  examples: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-muted-foreground">{examples}</p>
        </div>
        <div className="shrink-0 flex justify-end sm:justify-center">{children}</div>
      </div>
    </div>
  );
}

export function CookieConsentPanel() {
  const { locale } = useLocale();
  const {
    consent,
    isPanelOpen,
    closeConsentPanel,
    updateConsent,
  } = useCookieConsent();

  const [draftAnalytics, setDraftAnalytics] = useState(() =>
    consent.hasRecordedChoice ? consent.analytics : true,
  );
  const [draftReplay, setDraftReplay] = useState(() =>
    consent.hasRecordedChoice ? consent.sessionReplay : true,
  );

  useEffect(() => {
    if (!isPanelOpen) {
      return;
    }
    if (!consent.hasRecordedChoice) {
      setDraftAnalytics(true);
      setDraftReplay(true);
      return;
    }
    setDraftAnalytics(consent.analytics);
    setDraftReplay(consent.sessionReplay);
  }, [
    isPanelOpen,
    consent.hasRecordedChoice,
    consent.analytics,
    consent.sessionReplay,
  ]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeConsentPanel();
    }
  };

  const handleSave = () => {
    updateConsent({
      hasRecordedChoice: true,
      analytics: draftAnalytics,
      sessionReplay: draftReplay,
    });
    closeConsentPanel();
  };

  const analyticsEnabled = draftAnalytics;

  const isBlockingFirstVisit = !consent.hasRecordedChoice;

  if (!isPanelOpen) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={handleOpenChange} modal>
      <DialogContent
        className="sm:max-w-lg"
        blocking={isBlockingFirstVisit}
        hideCloseButton={isBlockingFirstVisit}
      >
        <DialogHeader>
          <DialogTitle>{t(locale, "cookieConsent.panel.title")}</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {t(locale, "cookieConsent.panel.intro")}
        </p>

        <p className="text-sm text-muted-foreground">
          {t(locale, "cookieConsent.panel.storageNote")}
        </p>

        <div className="space-y-3 max-h-[min(60vh,480px)] overflow-y-auto pr-1">
          <CategoryBlock
            title={t(locale, "cookieConsent.panel.essential.title")}
            description={t(locale, "cookieConsent.panel.essential.description")}
            examples={t(locale, "cookieConsent.panel.essential.examples")}
          >
            <Switch checked disabled aria-readonly />
          </CategoryBlock>

          <CategoryBlock
            title={t(locale, "cookieConsent.panel.analytics.title")}
            description={t(locale, "cookieConsent.panel.analytics.description")}
            examples={t(locale, "cookieConsent.panel.analytics.examples")}
          >
            <div className="flex items-center gap-2">
              <Label htmlFor="consent-analytics" className="sr-only">
                {t(locale, "cookieConsent.panel.analytics.title")}
              </Label>
              <Switch
                id="consent-analytics"
                checked={draftAnalytics}
                onCheckedChange={(checked) => {
                  setDraftAnalytics(checked);
                  if (!checked) {
                    setDraftReplay(false);
                  }
                }}
              />
            </div>
          </CategoryBlock>

          <CategoryBlock
            title={t(locale, "cookieConsent.panel.sessionReplay.title")}
            description={t(
              locale,
              "cookieConsent.panel.sessionReplay.description",
            )}
            examples={t(locale, "cookieConsent.panel.sessionReplay.examples")}
          >
            <div className="flex items-center gap-2">
              <Label htmlFor="consent-replay" className="sr-only">
                {t(locale, "cookieConsent.panel.sessionReplay.title")}
              </Label>
              <Switch
                id="consent-replay"
                checked={draftReplay && analyticsEnabled}
                disabled={!analyticsEnabled}
                onCheckedChange={(checked) => setDraftReplay(checked)}
              />
            </div>
          </CategoryBlock>
        </div>

        <DialogFooter className={cn("gap-2 sm:gap-0")}>
          <Button type="button" variant="outline" onClick={closeConsentPanel}>
            {t(locale, "cookieConsent.panel.cancel")}
          </Button>
          <Button type="button" variant="primary" onClick={handleSave}>
            {t(locale, "cookieConsent.panel.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
