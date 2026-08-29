import { NextResponse } from "next/server";
import { after } from "next/server";
import { logger } from "@/lib/observability/logger";
import { captureServerException } from "@/lib/analytics/track-server";
import { getPostHogServer } from "@/lib/observability/posthog-server";

/**
 * Staging/dev-only observability smoke test.
 * Requires header: x-observability-test-secret: $OBSERVABILITY_TEST_SECRET
 * Disabled when secret unset or in production without explicit ENABLE_OBSERVABILITY_TEST=1.
 */
export async function GET(request: Request): Promise<Response> {
  const secret = process.env.OBSERVABILITY_TEST_SECRET?.trim();
  const enabledExplicitly = process.env.ENABLE_OBSERVABILITY_TEST === "1";
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (isProduction && !enabledExplicitly) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const provided = request.headers.get("x-observability-test-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const mode = new URL(request.url).searchParams.get("mode") ?? "log";

  if (mode === "exception") {
    const err = new Error("Observability test server exception");
    await captureServerException(err, "observability-test", {
      $exception_source: "observability_test_route",
    });
    after(async () => {
      await logger.flush();
      await getPostHogServer()?.shutdown();
    });
    return NextResponse.json({ ok: true, mode: "exception" });
  }

  if (mode === "error-log") {
    logger.error("auth.observability.test_error", {
      outcome: "error",
      "error.code": "observability_test",
    });
  } else {
    logger.info("auth.observability.test_info", {
      outcome: "ok",
    });
  }

  after(async () => {
    await logger.flush();
  });

  return NextResponse.json({ ok: true, mode });
}
