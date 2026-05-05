import { createHmac } from "node:crypto";

import { getClientIpFromHeaders } from "@/lib/clientIpFromHeaders";

function getIpAuditPepper(): string | null {
  const explicit = process.env.AUTH_IP_ADDRESS_PEPPER?.trim();
  if (explicit) {
    return explicit;
  }

  const fallback = process.env.AUTH_SECRET?.trim() ?? process.env.NEXTAUTH_SECRET?.trim();
  if (fallback) {
    return fallback;
  }

  return null;
}

/**
 * HMAC-SHA256(hex) of the IP — stores a stable pseudonym, not the raw address.
 * Pepper must not change if you need to correlate rows over time.
 */
export function hashIpAddressForAudit(ip: string): string | null {
  const pepper = getIpAuditPepper();
  if (!pepper) {
    return null;
  }

  return createHmac("sha256", pepper).update(ip, "utf8").digest("hex");
}

export function getIpAddressHashFromHeaders(headers: Headers | undefined): string | null {
  if (!headers) {
    return null;
  }

  const ip = getClientIpFromHeaders(headers);
  if (!ip) {
    return null;
  }

  return hashIpAddressForAudit(ip);
}
