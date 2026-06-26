import { createHmac, timingSafeEqual } from "node:crypto";

export const PENDING_SIGNUP_CODE_EXPIRY_MINUTES = 15;
export const PENDING_SIGNUP_MAX_CODE_ATTEMPTS = 5;
export const VERIFICATION_CODE_RESEND_COOLDOWN_SECONDS = 60;

export type PendingSignupStep = "code" | "name" | "password" | "complete" | "invalid";

export type PendingSignupRecord = {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: Date;
  verifiedAt: Date | null;
  name: string | null;
  completedAt: Date | null;
  attempts: number;
  lastCodeSentAt: Date;
  preferredLanguage: string;
};

export function getVerificationCodeResendCooldownSeconds(
  lastCodeSentAt: Date,
  now: Date = new Date(),
): number {
  const elapsedSeconds = Math.floor((now.getTime() - lastCodeSentAt.getTime()) / 1000);
  const remainingSeconds = VERIFICATION_CODE_RESEND_COOLDOWN_SECONDS - elapsedSeconds;
  return remainingSeconds > 0 ? remainingSeconds : 0;
}

function getSignupCodePepper(): string {
  const pepper = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!pepper) {
    throw new Error("AUTH_SECRET is required for signup code hashing");
  }
  return pepper;
}

export function generateSignupVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashSignupVerificationCode(code: string): string {
  return createHmac("sha256", getSignupCodePepper()).update(code, "utf8").digest("hex");
}

export function isSignupVerificationCodeValid(code: string, codeHash: string): boolean {
  const computedHash = hashSignupVerificationCode(code);
  try {
    return timingSafeEqual(Buffer.from(computedHash, "utf8"), Buffer.from(codeHash, "utf8"));
  } catch {
    return false;
  }
}

export function getPendingSignupExpiryDate(
  now: Date = new Date(),
  minutes: number = PENDING_SIGNUP_CODE_EXPIRY_MINUTES,
): Date {
  const expiresAt = new Date(now);
  expiresAt.setMinutes(expiresAt.getMinutes() + minutes);
  return expiresAt;
}

export function isPendingSignupExpired(
  pendingSignup: Pick<PendingSignupRecord, "expiresAt" | "completedAt">,
  now: Date = new Date(),
): boolean {
  if (pendingSignup.completedAt) {
    return true;
  }
  return pendingSignup.expiresAt <= now;
}

export function hasPendingSignupExceededAttempts(
  pendingSignup: Pick<PendingSignupRecord, "attempts">,
): boolean {
  return pendingSignup.attempts >= PENDING_SIGNUP_MAX_CODE_ATTEMPTS;
}

export function getPendingSignupStep(
  pendingSignup: Pick<PendingSignupRecord, "verifiedAt" | "name" | "completedAt" | "expiresAt">,
  now: Date = new Date(),
): PendingSignupStep {
  if (pendingSignup.completedAt || pendingSignup.expiresAt <= now) {
    return "invalid";
  }

  if (!pendingSignup.verifiedAt) {
    return "code";
  }

  if (!pendingSignup.name?.trim()) {
    return "name";
  }

  return "password";
}

export function normalizeSignupEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidSignupName(name: string): boolean {
  return name.trim().length > 0 && name.trim().length <= 255;
}

export function isValidSignupPassword(password: string): boolean {
  return password.length >= 8;
}

export function deriveNameFromEmail(email: string): string {
  const localPart = email.split("@")[0]?.trim();
  if (!localPart) {
    return "Utilisateur";
  }
  return localPart.slice(0, 255);
}
