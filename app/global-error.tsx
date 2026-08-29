"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { getClientConsentAllowsAnalytics } from "@/lib/cookie-consent/consent-gate";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Root App Router global error boundary — captures unhandled client render errors.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    if (!getClientConsentAllowsAnalytics()) {
      return;
    }
    try {
      posthog.captureException(error, {
        $exception_source: "global-error",
        digest: error.digest,
      });
    } catch {
      /* PostHog unavailable */
    }
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <main style={{ padding: "2rem", fontFamily: "system-ui, sans-serif" }}>
          <h1>Une erreur est survenue</h1>
          <p>Réessaie ou recharge la page.</p>
          <button type="button" onClick={() => reset()}>
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
