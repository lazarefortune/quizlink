import { SeverityNumber } from "@opentelemetry/api-logs";
import {
  flushLoggerProvider,
  getLoggerProvider,
} from "@/lib/observability/otel-logs";
import { OBSERVABILITY_SERVICE_NAME } from "@/lib/observability/release";

export type LogAttributes = Record<string, string | number | boolean | undefined | null>;

function sanitizeAttributes(attributes?: LogAttributes): Record<string, string | number | boolean> {
  if (!attributes) {
    return {};
  }

  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(attributes)) {
    if (value === undefined || value === null) {
      continue;
    }
    out[key] = value;
  }
  return out;
}

function emit(
  severityNumber: SeverityNumber,
  severityText: string,
  message: string,
  attributes?: LogAttributes,
): void {
  const provider = getLoggerProvider();
  if (!provider) {
    if (process.env.NODE_ENV === "development") {
      // Local fallback when PostHog token is absent — never print secrets.
      console[severityText === "ERROR" || severityText === "WARN" ? "error" : "log"](
        `[${severityText}] ${message}`,
        sanitizeAttributes(attributes),
      );
    }
    return;
  }

  provider.getLogger(OBSERVABILITY_SERVICE_NAME).emit({
    body: message,
    severityNumber,
    severityText,
    attributes: sanitizeAttributes(attributes),
  });
}

/**
 * Structured application logger → PostHog Logs (OTLP).
 * Only explicit calls are exported — console.* is never auto-captured.
 */
export const logger = {
  info(message: string, attributes?: LogAttributes): void {
    emit(SeverityNumber.INFO, "INFO", message, attributes);
  },
  warn(message: string, attributes?: LogAttributes): void {
    emit(SeverityNumber.WARN, "WARN", message, attributes);
  },
  error(message: string, attributes?: LogAttributes): void {
    emit(SeverityNumber.ERROR, "ERROR", message, attributes);
  },
  async flush(): Promise<void> {
    await flushLoggerProvider();
  },
};
