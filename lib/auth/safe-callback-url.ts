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

export function buildSignUpHref(callbackUrl: string | null | undefined): string {
  const safeCallback = getSafeCallbackPath(callbackUrl);
  if (safeCallback) {
    return `/auth/signup?callbackUrl=${encodeURIComponent(safeCallback)}`;
  }

  return "/auth/signup";
}

type SignupFlowHrefOptions = {
  callbackUrl?: string | null;
};

function buildSignupFlowHref(
  path: string,
  email: string,
  options: SignupFlowHrefOptions = {},
): string {
  const params = new URLSearchParams({ email });

  const safeCallback = getSafeCallbackPath(options.callbackUrl);
  if (safeCallback) {
    params.set("callbackUrl", safeCallback);
  }

  return `${path}?${params.toString()}`;
}

export function buildSignupVerifyEmailHref(
  email: string,
  callbackUrl: string | null | undefined,
): string {
  return buildSignupFlowHref("/auth/verify-email", email, { callbackUrl });
}

export function buildSignupNameHref(
  email: string,
  callbackUrl: string | null | undefined,
): string {
  return buildSignupFlowHref("/auth/signup/name", email, { callbackUrl });
}

export function buildSignupPasswordHref(
  email: string,
  callbackUrl: string | null | undefined,
): string {
  return buildSignupFlowHref("/auth/signup/password", email, { callbackUrl });
}

export type BuildSignInHrefOptions = {
  verified?: boolean;
  email?: string | null;
};

export function buildSignInHref(
  callbackUrl: string | null | undefined,
  options: BuildSignInHrefOptions = {},
): string {
  const params = new URLSearchParams();

  if (options.verified) {
    params.set("verified", "true");
  }

  const trimmedEmail = options.email?.trim();
  if (trimmedEmail) {
    params.set("email", trimmedEmail);
  }

  const safeCallback = getSafeCallbackPath(callbackUrl);
  if (safeCallback) {
    params.set("callbackUrl", safeCallback);
  }

  const query = params.toString();
  return query ? `/auth/signin?${query}` : "/auth/signin";
}
