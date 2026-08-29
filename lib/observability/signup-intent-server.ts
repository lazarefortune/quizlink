import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import {
  SIGNUP_INTENT_COOKIE,
  isSignupIntentCookieValue,
} from "@/lib/observability/signup-intent";

function readCookieValue(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split("=");
    if (rawKey === name) {
      return rest.join("=");
    }
  }
  return undefined;
}

/**
 * Read signup intent from the OAuth callback request, then clear the cookie
 * so a later normal Google login cannot be misclassified as signup_existing_user.
 */
export async function consumeSignupIntentFromRequest(
  req: NextRequest | undefined,
): Promise<boolean> {
  const value = readCookieValue(req?.headers.get("cookie"), SIGNUP_INTENT_COOKIE);
  const hadIntent = isSignupIntentCookieValue(value);

  try {
    const jar = await cookies();
    if (jar.get(SIGNUP_INTENT_COOKIE)) {
      jar.delete(SIGNUP_INTENT_COOKIE);
    }
  } catch {
    /* cookies() may be unavailable in some auth contexts */
  }

  return hadIntent;
}
