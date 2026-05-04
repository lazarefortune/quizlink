import { z } from "zod";

export const cookieConsentStoredSchema = z.object({
  version: z.literal(1),
  analytics: z.boolean(),
  sessionReplay: z.boolean(),
});

export type CookieConsentStored = z.infer<typeof cookieConsentStoredSchema>;
