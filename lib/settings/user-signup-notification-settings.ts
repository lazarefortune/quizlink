import { z } from "zod";

import { APP_SETTING_KEYS } from "@/lib/settings/app-setting-keys";
import { getAppSetting, upsertAppSetting } from "@/lib/settings/app-settings";

const userSignupNotificationEmailsSchema = z
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

export const userSignupNotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  emails: userSignupNotificationEmailsSchema,
  notifyOnEmailSignup: z.boolean(),
  notifyOnGoogleSignup: z.boolean(),
});

export type UserSignupNotificationSettings = z.infer<
  typeof userSignupNotificationSettingsSchema
>;

export type UserSignupNotificationSettingsInput = z.input<
  typeof userSignupNotificationSettingsSchema
>;

export const USER_SIGNUP_NOTIFICATION_SETTINGS_DEFAULTS: UserSignupNotificationSettings = {
  enabled: false,
  emails: [],
  notifyOnEmailSignup: true,
  notifyOnGoogleSignup: true,
};

export async function getUserSignupNotificationSettings(): Promise<UserSignupNotificationSettings> {
  const raw = await getAppSetting(APP_SETTING_KEYS.USER_SIGNUP_NOTIFICATIONS);
  if (raw === null) {
    return { ...USER_SIGNUP_NOTIFICATION_SETTINGS_DEFAULTS };
  }
  const parsed = userSignupNotificationSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ...USER_SIGNUP_NOTIFICATION_SETTINGS_DEFAULTS };
  }
  return parsed.data;
}

export async function updateUserSignupNotificationSettings(
  input: UserSignupNotificationSettingsInput,
): Promise<UserSignupNotificationSettings> {
  const parsed = userSignupNotificationSettingsSchema.parse(input);
  await upsertAppSetting(APP_SETTING_KEYS.USER_SIGNUP_NOTIFICATIONS, parsed);
  return parsed;
}
