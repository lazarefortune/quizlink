import { cookies } from "next/headers";

import { TIME_ZONE_COOKIE } from "./constants";
import { resolveEffectiveTimeZone } from "./timezone";

export type RequestTimeZoneOptions = {
  /** `null` = automatic (cookie/browser). Non-null = manual user preference. */
  userTimeZone?: string | null;
};

/**
 * Server-only: resolves the effective IANA timezone for the current request.
 * Never uses the Node.js / Docker / VPS system timezone.
 */
export async function getRequestTimeZone(
  options: RequestTimeZoneOptions = {},
): Promise<string> {
  let cookieTimeZone: string | undefined;

  try {
    const jar = await cookies();
    cookieTimeZone = jar.get(TIME_ZONE_COOKIE)?.value;
  } catch {
    cookieTimeZone = undefined;
  }

  return resolveEffectiveTimeZone({
    userTimeZone: options.userTimeZone,
    cookieTimeZone,
  });
}
