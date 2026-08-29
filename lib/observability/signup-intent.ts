/**
 * Short-lived cookie marking that the user started Google OAuth from the signup page.
 * Used server-side to distinguish signup_completed vs signup_existing_user vs plain login.
 */

export const SIGNUP_INTENT_COOKIE = "ql_signup_intent";
export const SIGNUP_INTENT_MAX_AGE_SECONDS = 600;

export function buildSignupIntentCookieValue(): string {
  return "1";
}

export function isSignupIntentCookieValue(raw: string | undefined | null): boolean {
  return raw === "1";
}
