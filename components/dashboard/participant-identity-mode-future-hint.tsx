import { ParticipantIdentityModeAlertIcon } from "@/components/dashboard/participant-identity-mode-alert-icon";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

type ParticipantIdentityModeFutureHintProps = {
  locale: Locale;
  hasExistingResponses?: boolean;
};

export function ParticipantIdentityModeFutureHint({
  locale,
  hasExistingResponses = false,
}: ParticipantIdentityModeFutureHintProps) {
  const message = hasExistingResponses
    ? `${t(locale, "participantMode.existingAttemptsKeepMode")} ${t(locale, "participantMode.appliesToFutureAttempts")}`
    : t(locale, "participantMode.appliesToFutureAttempts");

  return (
    <div
      data-testid="participant-identity-mode-future-hint"
      className="flex items-start gap-2.5 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5 text-sm leading-snug text-muted-foreground"
    >
      <ParticipantIdentityModeAlertIcon className="mt-0.5 text-warning" />
      <p>{message}</p>
    </div>
  );
}
