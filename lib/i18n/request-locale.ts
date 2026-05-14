import { headers } from "next/headers";

import type { Locale } from "@/lib/i18n";

/**
 * Best-effort locale for server-rendered pages (client locale lives in localStorage).
 */
export async function getRequestLocale(): Promise<Locale> {
  const headerList = await headers();
  const accept = headerList.get("accept-language");
  if (!accept) {
    return "fr";
  }
  const first = accept.split(",")[0]?.trim().split("-")[0]?.toLowerCase() ?? "";
  return first === "en" ? "en" : "fr";
}
