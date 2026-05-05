import { getIpAddressHashFromHeaders } from "@/lib/ipAddressAuditHash";

export type AuthAuditFields = {
  ipAddressHash: string | null;
  userAgent: string | null;
};

export function truncateUserAgent(userAgent: string | null | undefined): string | null {
  if (userAgent == null) {
    return null;
  }

  const trimmed = userAgent.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length <= 500) {
    return trimmed;
  }

  return trimmed.slice(0, 500);
}

export function getAuthAuditFieldsFromHeaders(headers: Headers | undefined): AuthAuditFields {
  return {
    ipAddressHash: getIpAddressHashFromHeaders(headers),
    userAgent: truncateUserAgent(headers?.get("user-agent")),
  };
}
