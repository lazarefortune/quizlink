/**
 * Single source of truth for PostHog event names and allowed properties.
 * Use with track() and merge buildCommonEventProps() for consistent analytics.
 */

export const EVENTS = {
  landing_view: "landing_view",
  cta_click: "cta_click",
  signup_completed: "signup_completed",
  email_verified: "email_verified",
  quiz_created: "quiz_created",
  participant_invited: "participant_invited",
  attempt_completed: "attempt_completed",
  anonymous_quiz_completed: "anonymous_quiz_completed",
  pricing_viewed: "pricing_viewed",
  checkout_started: "checkout_started",
  checkout_completed: "checkout_completed",
  ai_generation_used: "ai_generation_used",
  report_generated: "report_generated",
  page_view: "page_view",
} as const;

export type EventName = keyof typeof EVENTS;

/** Allowed properties per event (snake_case). Max 4–6 event-specific props + common. */
export type EventPropsMap = {
  landing_view: { page: "landing" };
  cta_click: {
    cta_type: "create_quiz" | "generate_ai" | "pricing" | "signup" | "signin";
    page: string;
  };
  signup_completed: { from_page: string; language: "fr" | "en" };
  email_verified: { method: "code"; minutes_since_signup?: number };
  quiz_created: {
    quiz_id: string;
    source: "builder" | "ai";
    visibility: "PUBLIC" | "PRIVATE";
    question_count: number;
    has_time_limit: boolean;
    show_answer_immediately: boolean;
    randomized: boolean;
  };
  participant_invited: {
    quiz_id: string;
    participant_id?: string;
    delivery: "email" | "link";
    is_first_invite_for_quiz?: boolean;
  };
  attempt_completed: {
    quiz_id: string;
    participant_id?: string;
    score_pct: number;
    question_count: number;
    duration_sec?: number;
    is_first_attempt_for_participant?: boolean;
  };
  anonymous_quiz_completed: {
    quiz_id: string;
    score_pct: number;
    question_count: number;
    duration_sec?: number;
  };
  pricing_viewed: { page: "pricing" };
  checkout_started: { pack_id: string; price?: number; currency?: string };
  checkout_completed: {
    pack_id?: string;
    coins_purchased?: number;
    price?: number;
    currency?: string;
    session_id?: string;
  };
  ai_generation_used: {
    generation_type: "text" | "pdf";
    question_count?: number;
    coins_spent: number;
    text_length?: number;
    language?: "fr" | "en";
    quiz_id?: string;
  };
  report_generated: {
    quiz_id: string;
    participant_id: string;
    coins_spent: number;
  };
  page_view: { path: string; search?: string; referrer?: string };
};

/** Truncate user-generated text to max length for analytics. */
export function truncateForAnalytics(value: string, maxLength: number = 120): string {
  if (typeof value !== "string") return "";
  return value.length <= maxLength ? value : value.slice(0, maxLength);
}
