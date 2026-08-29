/**
 * Shared release identifiers for PostHog Error Tracking / Logs.
 * Prefer explicit env, then Vercel/Git commit, then package version.
 */

export const OBSERVABILITY_SERVICE_NAME = "quizlink-web";

export function getDeploymentEnvironment(): string {
  return (
    process.env.VERCEL_ENV ||
    process.env.DEPLOYMENT_ENVIRONMENT ||
    process.env.NODE_ENV ||
    "development"
  );
}

export function getServiceVersion(): string {
  return (
    process.env.POSTHOG_RELEASE_VERSION ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    process.env.npm_package_version ||
    "0.0.0"
  );
}
