import { z } from "zod";

import { APP_SETTING_KEYS } from "@/lib/settings/app-setting-keys";
import { getAppSetting, upsertAppSetting } from "@/lib/settings/app-settings";

const supportNotificationEmailsSchema = z
  .array(z.string())
  .transform((arr) => {
    const trimmed = arr.map((e) => e.trim()).filter((e) => e.length > 0);
    const seen = new Set<string>();
    const deduped: string[] = [];
    for (const email of trimmed) {
      const normalized = email.toLowerCase();
      if (seen.has(normalized)) {
        continue;
      }
      seen.add(normalized);
      deduped.push(email);
    }
    return deduped;
  })
  .pipe(
    z
      .array(z.string().email({ message: "Email invalide" }))
      .max(10, { message: "10 adresses maximum" }),
  );

export const supportNotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  emails: supportNotificationEmailsSchema,
  notifyOnBug: z.boolean(),
  notifyOnSuggestion: z.boolean(),
  notifyOnFeedback: z.boolean(),
});

export type SupportNotificationSettings = z.infer<typeof supportNotificationSettingsSchema>;

export type SupportNotificationSettingsInput = z.input<typeof supportNotificationSettingsSchema>;

export const SUPPORT_NOTIFICATION_SETTINGS_DEFAULTS: SupportNotificationSettings = {
  enabled: false,
  emails: [],
  notifyOnBug: true,
  notifyOnSuggestion: true,
  notifyOnFeedback: false,
};

export async function getSupportNotificationSettings(): Promise<SupportNotificationSettings> {
  const raw = await getAppSetting(APP_SETTING_KEYS.SUPPORT_NOTIFICATIONS);
  if (raw === null) {
    return { ...SUPPORT_NOTIFICATION_SETTINGS_DEFAULTS };
  }
  const parsed = supportNotificationSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ...SUPPORT_NOTIFICATION_SETTINGS_DEFAULTS };
  }
  return parsed.data;
}

export async function updateSupportNotificationSettings(
  input: SupportNotificationSettingsInput,
): Promise<SupportNotificationSettings> {
  const parsed = supportNotificationSettingsSchema.parse(input);
  await upsertAppSetting(APP_SETTING_KEYS.SUPPORT_NOTIFICATIONS, parsed);
  return parsed;
}
