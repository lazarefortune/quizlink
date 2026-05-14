"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { acceptLegalDocumentsAction } from "@/app/(app)/onboarding/legal/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

type LegalConsentModalProps = {
  needsLegalConsent: boolean;
};

export function LegalConsentModal({ needsLegalConsent }: LegalConsentModalProps) {
  const { locale } = useLocale();
  const router = useRouter();
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleContinue = () => {
    setError(null);
    if (!legalAccepted) {
      setError(t(locale, "onboarding.legal.requiredError"));
      return;
    }

    startTransition(async () => {
      const result = await acceptLegalDocumentsAction(true, locale);
      if (result.success) {
        setLegalAccepted(false);
        router.refresh();
        return;
      }
      setError(result.error);
    });
  };

  return (
    <Dialog
      open={needsLegalConsent}
      onOpenChange={(nextOpen) => {
        if (needsLegalConsent && !nextOpen) {
          return;
        }
      }}
    >
      <DialogContent
        blocking
        hideCloseButton
        className="max-h-[85vh] w-full max-w-md gap-3 p-4 sm:max-w-xl sm:gap-3 sm:p-4 rounded-xl"
        aria-describedby="legal-consent-description"
      >
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {t(locale, "onboarding.legal.title")}
          </DialogTitle>
          <DialogDescription id="legal-consent-description" asChild>
            <span className="text-base text-muted-foreground">
              {t(locale, "onboarding.legal.descriptionIntro")}
              <Link
                href="/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                {t(locale, "auth.signUp.legalTermsLink")}
              </Link>
              {t(locale, "onboarding.legal.descriptionMid")}
              <Link
                href="/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                {t(locale, "auth.signUp.legalPrivacyLink")}
              </Link>
              {t(locale, "onboarding.legal.descriptionEnd")}
            </span>
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="form-error" role="alert">
            {error}
          </div>
        ) : null}

        <div className="flex gap-2.5 rounded-xs border border-border/60 bg-secondary/30 p-2.5">
          <Checkbox
            id="legal-consent-checkbox"
            checked={legalAccepted}
            onCheckedChange={setLegalAccepted}
            aria-required="true"
            size="sm"
            className="mt-0.5 shrink-0"
          />
          <Label
            htmlFor="legal-consent-checkbox"
            className="cursor-pointer normal-case text-xs font-normal leading-snug text-foreground sm:text-sm"
          >
            {t(locale, "auth.signUp.legalIntro")}
            <Link
              href="/legal/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline-offset-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {t(locale, "auth.signUp.legalTermsLink")}
            </Link>
            {t(locale, "auth.signUp.legalMid")}
            <Link
              href="/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline-offset-2 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {t(locale, "auth.signUp.legalPrivacyLink")}
            </Link>
            {t(locale, "auth.signUp.legalEnd")}
          </Label>
        </div>

        <DialogFooter className="pt-0 sm:justify-stretch">
          <Button
            type="button"
            variant="primary"
            size="default"
            className="h-10 w-full"
            disabled={!legalAccepted || isPending}
            onClick={handleContinue}
          >
            {isPending ? (
              t(locale, "common.loading")
            ) : (
              <>
                {t(locale, "onboarding.legal.continue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
