function messageLooksLikePayloadTooLarge(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("body exceeded") ||
    normalized.includes("payload too large") ||
    normalized.includes("request entity too large") ||
    normalized.includes("413") ||
    normalized.includes("content too large")
  );
}

/**
 * Detects client-side failures when the request body exceeds Next.js Server Actions limits
 * (often before the server action handler runs).
 */
export function isSaveQuizPayloadTooLargeError(error: unknown): boolean {
  if (error instanceof Error) {
    return messageLooksLikePayloadTooLarge(error.message);
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    const raw = (error as { message: unknown }).message;
    if (typeof raw === "string") {
      return messageLooksLikePayloadTooLarge(raw);
    }
  }
  return false;
}
