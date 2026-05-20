const DEFAULT_POST_AUTH_PATH = "/dashboard";

export function isSafeCallbackUrl(callbackUrl: string | null | undefined): boolean {
  return getSafeCallbackPath(callbackUrl) !== null;
}

function getSafeCallbackPath(callbackUrl: string | null | undefined): string | null {
  if (!callbackUrl) {
    return null;
  }

  const trimmed = callbackUrl.trim();
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  return null;
}

/**
 * Restricts post-auth redirects to same-origin relative paths.
 */
export function resolveSafeCallbackUrl(callbackUrl: string | null | undefined): string {
  return getSafeCallbackPath(callbackUrl) ?? DEFAULT_POST_AUTH_PATH;
}

type VerifyEmailHrefOptions = {
  created?: boolean;
  requiresVerification?: boolean;
};

export function buildVerifyEmailHref(
  email: string,
  callbackUrl: string | null | undefined,
  options: VerifyEmailHrefOptions = {},
): string {
  const params = new URLSearchParams({ email });

  const safeCallback = getSafeCallbackPath(callbackUrl);
  if (safeCallback) {
    params.set("callbackUrl", safeCallback);
  }

  if (options.created) {
    params.set("created", "true");
  }

  if (options.requiresVerification) {
    params.set("requiresVerification", "true");
  }

  return `/auth/verify-email?${params.toString()}`;
}

export function buildSignInHref(callbackUrl: string | null | undefined, verified = false): string {
  const params = new URLSearchParams();

  if (verified) {
    params.set("verified", "true");
  }

  const safeCallback = getSafeCallbackPath(callbackUrl);
  if (safeCallback) {
    params.set("callbackUrl", safeCallback);
  }

  const query = params.toString();
  return query ? `/auth/signin?${query}` : "/auth/signin";
}
