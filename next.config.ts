import type { NextConfig } from "next";
import { getPosthogProxyBasePath } from "./lib/analytics/posthog-proxy-path";
import { QUIZ_SAVE_SERVER_ACTION_BODY_SIZE_LIMIT } from "./lib/builder/quizPayloadLimits";

const posthogProxyBase = getPosthogProxyBasePath();

const nextConfig: NextConfig = {
  /**
   * Required for PostHog (and similar) reverse proxies: the API uses paths like `/e/`
   * with a trailing slash. Without this, Next.js responds with 308 redirects that break
   * event capture and session replay. See PostHog Next.js proxy docs.
   */
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ["pdf-parse", "mariadb", "@prisma/adapter-mariadb"],
  // Allow raw body for Stripe webhooks
  experimental: {
    serverActions: {
      /** Quiz builder sends full `QuizBuilder` including optional base64 question images. */
      bodySizeLimit: QUIZ_SAVE_SERVER_ACTION_BODY_SIZE_LIMIT,
    },
  },
  async redirects() {
    return [
      {
        source: "/dashboard/quiz/:quizId/preview",
        destination: "/preview/quiz/:quizId",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: `${posthogProxyBase}/static/:path*`,
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: `${posthogProxyBase}/array/:path*`,
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: `${posthogProxyBase}/:path*`,
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
};

export default nextConfig;
