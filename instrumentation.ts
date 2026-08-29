import type { Instrumentation } from "next";
import { registerGlobalLoggerProvider } from "@/lib/observability/otel-logs";

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    registerGlobalLoggerProvider();
  }
}

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  _context,
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { captureServerException } = await import("@/lib/analytics/track-server");
  const { parsePostHogDistinctIdFromCookieHeader } = await import(
    "@/lib/analytics/parse-posthog-cookie"
  );

  const cookieHeader = request.headers.cookie;
  const cookieString = Array.isArray(cookieHeader)
    ? cookieHeader.join("; ")
    : cookieHeader;
  const distinctId = parsePostHogDistinctIdFromCookieHeader(cookieString);

  await captureServerException(err, distinctId, {
    $exception_source: "next_onRequestError",
    path: request.path,
    method: request.method,
  });
};
