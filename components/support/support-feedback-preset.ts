import type { FeedbackType } from "@/lib/schemas/feedback.schema";

export type SupportFeedbackMetadataValue = string | number | boolean | null;

export type SupportFeedbackPreset = {
  type: Extract<FeedbackType, "SAVE_ERROR_REPORT">;
  message?: string;
  metadata?: Record<string, SupportFeedbackMetadataValue>;
  quizId?: string;
};

export function sanitizeSupportFeedbackMetadata(
  metadata: Record<string, SupportFeedbackMetadataValue> | undefined,
): Record<string, string | number | boolean> | undefined {
  if (!metadata) {
    return undefined;
  }

  const sanitized: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      sanitized[key] = value;
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}
