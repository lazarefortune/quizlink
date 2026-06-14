import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

import { ATTEMPT_DETAILS_ERROR } from "./creator-response-attempts";

export function resolveAttemptDetailsError(locale: Locale, error: string): string {
  if (error === ATTEMPT_DETAILS_ERROR.LOCKED) {
    return t(locale, "dashboard.attemptDetailsLocked");
  }
  if (error === ATTEMPT_DETAILS_ERROR.PURGED) {
    return t(locale, "dashboard.attemptDetailsPurgedLongDescription");
  }
  return error;
}
