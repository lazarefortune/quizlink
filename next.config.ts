import type { NextConfig } from "next";
import { withPostHogConfig } from "@posthog/nextjs-config";
import { getPosthogProxyBasePath } from "./lib/analytics/posthog-proxy-path";
import { QUIZ_SAVE_SERVER_ACTION_BODY_SIZE_LIMIT } from "./lib/builder/quizPayloadLimits";
import { getServiceVersion } from "./lib/observability/release";

const posthogProxyBase = getPosthogProxyBasePath();

const nextConfig: NextConfig = {
  /**
   * Required for compact Docker production images. Standalone traces runtime deps
   * (including Prisma adapter / mariadb / pdf-parse via serverExternalPackages).
   * Does not change local `pnpm dev` / `pnpm start` outside Docker.
   */
  output: "standalone",
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

const personalApiKey = process.env.POSTHOG_API_KEY?.trim();
const projectId = process.env.POSTHOG_PROJECT_ID?.trim();
const canUploadSourcemaps =
  process.env.NODE_ENV === "production" &&
  Boolean(personalApiKey) &&
  Boolean(projectId) &&
  process.env.POSTHOG_SOURCEMAPS_DISABLED !== "1";

const configWithPostHog = personalApiKey && projectId
  ? withPostHogConfig(nextConfig, {
      personalApiKey,
      projectId,
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://eu.posthog.com",
      sourcemaps: {
        enabled: canUploadSourcemaps,
        releaseName: process.env.POSTHOG_RELEASE_NAME?.trim() || "quizlink-web",
        releaseVersion: getServiceVersion(),
        deleteAfterUpload: true,
      },
    })
  : nextConfig;

export default configWithPostHog;
