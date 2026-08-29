import { after } from "next/server";
import { logger } from "@/lib/observability/logger";
import { flushLoggerProvider } from "@/lib/observability/otel-logs";

/** Flush OTEL logs after the server action / route response is sent. */
export function scheduleObservabilityFlush(): void {
  after(async () => {
    try {
      await logger.flush();
      await flushLoggerProvider();
    } catch {
      /* ignore */
    }
  });
}
