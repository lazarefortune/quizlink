import { BatchLogRecordProcessor, LoggerProvider } from "@opentelemetry/sdk-logs";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { logs } from "@opentelemetry/api-logs";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  getDeploymentEnvironment,
  getServiceVersion,
  OBSERVABILITY_SERVICE_NAME,
} from "@/lib/observability/release";

const POSTHOG_EU_LOGS_URL = "https://eu.i.posthog.com/i/v1/logs";

let loggerProviderSingleton: LoggerProvider | null = null;
let globalProviderRegistered = false;

function getProjectToken(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim() ||
    process.env.NEXT_PUBLIC_POSTHOG_TOKEN?.trim() ||
    process.env.POSTHOG_PROJECT_TOKEN?.trim() ||
    undefined
  );
}

/**
 * Lazily create a single LoggerProvider for the Node.js process.
 * No-op when the project token is missing (local/dev without PostHog).
 */
export function getLoggerProvider(): LoggerProvider | null {
  const token = getProjectToken();
  if (!token) {
    return null;
  }

  if (loggerProviderSingleton) {
    return loggerProviderSingleton;
  }

  const logsUrl = process.env.POSTHOG_LOGS_URL?.trim() || POSTHOG_EU_LOGS_URL;

  loggerProviderSingleton = new LoggerProvider({
    resource: resourceFromAttributes({
      "service.name": OBSERVABILITY_SERVICE_NAME,
      "deployment.environment": getDeploymentEnvironment(),
      "service.version": getServiceVersion(),
    }),
    processors: [
      new BatchLogRecordProcessor({
        exporter: new OTLPLogExporter({
          url: logsUrl,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }),
      }),
    ],
  });

  return loggerProviderSingleton;
}

export function registerGlobalLoggerProvider(): void {
  if (globalProviderRegistered) {
    return;
  }
  const provider = getLoggerProvider();
  if (!provider) {
    return;
  }
  logs.setGlobalLoggerProvider(provider);
  globalProviderRegistered = true;
}

export async function flushLoggerProvider(): Promise<void> {
  const provider = loggerProviderSingleton;
  if (!provider) {
    return;
  }
  try {
    await provider.forceFlush();
  } catch {
    /* ignore flush errors */
  }
}
