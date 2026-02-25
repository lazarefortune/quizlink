/**
 * PostHog event name constants. Use with track() and merge buildCommonEventProps().
 * See lib/analytics/contract.ts for property types.
 */

export { EVENTS } from "./contract";
export const LANDING_VIEW = "landing_view";
export const CTA_CLICK = "cta_click";
export const SIGNUP_COMPLETED = "signup_completed";
export const EMAIL_VERIFIED = "email_verified";
export const QUIZ_CREATED = "quiz_created";
export const PARTICIPANT_INVITED = "participant_invited";
export const ATTEMPT_COMPLETED = "attempt_completed";
export const PRICING_VIEWED = "pricing_viewed";
export const CHECKOUT_STARTED = "checkout_started";
export const CHECKOUT_COMPLETED = "checkout_completed";
export const AI_GENERATION_USED = "ai_generation_used";
export const REPORT_GENERATED = "report_generated";
export const PAGE_VIEW = "page_view";
