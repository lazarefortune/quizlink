const MIN_INTERVAL_MS = 30_000;
const MAX_SENDS_PER_HOUR = 10;
const HOUR_MS = 60 * 60 * 1000;

type RateLimitEntry = {
  lastSentAt: number;
  windowStartAt: number;
  sendCountInWindow: number;
};

const rateLimitByAdminId = new Map<string, RateLimitEntry>();

export type AdminTestEmailRateLimitResult =
  | { allowed: true }
  | { allowed: false; reason: "too_soon" | "hourly_limit" };

export function checkAdminTestEmailRateLimit(adminId: string): AdminTestEmailRateLimitResult {
  const now = Date.now();
  const entry = rateLimitByAdminId.get(adminId);

  if (!entry) {
    return { allowed: true };
  }

  if (now - entry.lastSentAt < MIN_INTERVAL_MS) {
    return { allowed: false, reason: "too_soon" };
  }

  const windowExpired = now - entry.windowStartAt >= HOUR_MS;
  const sendCount = windowExpired ? 0 : entry.sendCountInWindow;

  if (sendCount >= MAX_SENDS_PER_HOUR) {
    return { allowed: false, reason: "hourly_limit" };
  }

  return { allowed: true };
}

export function recordAdminTestEmailSend(adminId: string): void {
  const now = Date.now();
  const entry = rateLimitByAdminId.get(adminId);

  if (!entry) {
    rateLimitByAdminId.set(adminId, {
      lastSentAt: now,
      windowStartAt: now,
      sendCountInWindow: 1,
    });
    return;
  }

  const windowExpired = now - entry.windowStartAt >= HOUR_MS;

  rateLimitByAdminId.set(adminId, {
    lastSentAt: now,
    windowStartAt: windowExpired ? now : entry.windowStartAt,
    sendCountInWindow: windowExpired ? 1 : entry.sendCountInWindow + 1,
  });
}

/** Resets in-memory state — for tests only. */
export function resetAdminTestEmailRateLimitForTests(): void {
  rateLimitByAdminId.clear();
}
