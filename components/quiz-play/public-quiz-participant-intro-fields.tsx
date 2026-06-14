"use client";

import { useEffect, useState } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import {
  clearParticipantLocalProfile,
  hasParticipantLocalProfile,
  loadParticipantLocalProfile,
} from "@/lib/quiz/participantLocalProfile";
import type { ParticipantIdentityMode } from "@/types/participant-identity";

type PublicQuizParticipantIntroFieldsProps = {
  locale: Locale;
  identityMode: ParticipantIdentityMode;
  participantName: string;
  participantEmail: string;
  hasConsent: boolean;
  onParticipantNameChange: (value: string) => void;
  onParticipantEmailChange: (value: string) => void;
  onHasConsentChange: (value: boolean) => void;
  onClearLocalProfile: () => void;
};

export function PublicQuizParticipantIntroFields({
  locale,
  identityMode,
  participantName,
  participantEmail,
  hasConsent,
  onParticipantNameChange,
  onParticipantEmailChange,
  onHasConsentChange,
  onClearLocalProfile,
}: PublicQuizParticipantIntroFieldsProps) {
  const [showClearLink, setShowClearLink] = useState(false);

  useEffect(() => {
    setShowClearLink(hasParticipantLocalProfile());
  }, []);

  const modeMessageKey =
    identityMode === "ANONYMOUS"
      ? "quiz.participantIdentityAnonymousMessage"
      : identityMode === "PSEUDONYM"
        ? "quiz.participantIdentityPseudonymMessage"
        : "quiz.participantIdentityNameEmailMessage";

  const handleClearLocal = () => {
    clearParticipantLocalProfile();
    onClearLocalProfile();
    setShowClearLink(false);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-muted/20 px-4 py-4 sm:px-5">
      <p className="text-sm leading-relaxed text-muted-foreground">{t(locale, modeMessageKey)}</p>

      {identityMode === "PSEUDONYM" || identityMode === "NAME_EMAIL" ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="participant-name">{t(locale, "quiz.participantNameOrPseudonym")}</Label>
            <Input
              id="participant-name"
              name="participantName"
              autoComplete="nickname"
              value={participantName}
              onChange={(event) => onParticipantNameChange(event.target.value)}
              placeholder={t(locale, "quiz.participantNamePlaceholder")}
            />
          </div>

          {identityMode === "NAME_EMAIL" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="participant-email">
                  {t(locale, "dashboard.participantEmailLabel")}
                </Label>
                <Input
                  id="participant-email"
                  name="participantEmail"
                  type="email"
                  autoComplete="email"
                  value={participantEmail}
                  onChange={(event) => onParticipantEmailChange(event.target.value)}
                  placeholder={t(locale, "quiz.participantEmailPlaceholder")}
                />
              </div>
              <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                <Checkbox
                  checked={hasConsent}
                  onCheckedChange={(checked) => onHasConsentChange(checked === true)}
                  className="mt-0.5"
                />
                <span>{t(locale, "quiz.participantIdentityNameEmailConsent")}</span>
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      {showClearLink ? (
        <button
          type="button"
          onClick={handleClearLocal}
          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          {t(locale, "quiz.clearLocalParticipantProfile")}
        </button>
      ) : null}
    </div>
  );
}

export function hydrateParticipantFieldsFromLocalProfile(): {
  participantName: string;
  participantEmail: string;
} {
  const profile = loadParticipantLocalProfile();
  return {
    participantName: profile?.name ?? "",
    participantEmail: profile?.email ?? "",
  };
}
