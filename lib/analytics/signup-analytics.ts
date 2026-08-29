/**
 * Analytic error codes for signup instrumentation.
 * Keep values stable and free of PII / provider raw messages.
 * Only codes that have a real emission path should live here.
 */

export type SignupMethod = "email" | "google";

export type SignupFailureStage =
  | "validation"
  | "account_creation"
  | "verification_email"
  | "verification"
  | "oauth_callback";

export type SignupAnalyticsErrorCode =
  | "invalid_input"
  | "email_already_exists"
  | "database_error"
  | "oauth_callback_error"
  | "verification_email_failed"
  | "invalid_verification_token"
  | "expired_verification_token"
  | "signup_session_invalid"
  | "unknown";

export function mapSignupDomainErrorToAnalyticsCode(
  domainCode: string | undefined,
): SignupAnalyticsErrorCode {
  if (domainCode === "EMAIL_ALREADY_IN_USE") {
    return "email_already_exists";
  }
  return "unknown";
}
