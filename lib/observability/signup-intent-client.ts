"use client";

import {
  SIGNUP_INTENT_COOKIE,
  SIGNUP_INTENT_MAX_AGE_SECONDS,
  buildSignupIntentCookieValue,
} from "@/lib/observability/signup-intent";

function cookieSecuritySuffix(): string {
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return "; Secure";
  }
  return "";
}

/** Mark upcoming Google OAuth as originating from the signup funnel. */
export function markSignupIntentForGoogleOAuth(): void {
  if (typeof document === "undefined") {
    return;
  }
  const value = buildSignupIntentCookieValue();
  document.cookie = `${SIGNUP_INTENT_COOKIE}=${value}; Path=/; Max-Age=${SIGNUP_INTENT_MAX_AGE_SECONDS}; SameSite=Lax${cookieSecuritySuffix()}`;
}

/** Clear signup intent (e.g. on /auth/signin so a later login is not misclassified). */
export function clearSignupIntentCookie(): void {
  if (typeof document === "undefined") {
    return;
  }
  document.cookie = `${SIGNUP_INTENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${cookieSecuritySuffix()}`;
}
