"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import { auth } from "@/lib/auth";
import {
  updateSupportNotificationSettings,
  type SupportNotificationSettingsInput,
} from "@/lib/settings/support-notification-settings";

export type UpdateSupportNotificationSettingsActionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateSupportNotificationSettingsAction(
  input: SupportNotificationSettingsInput,
): Promise<UpdateSupportNotificationSettingsActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await updateSupportNotificationSettings(input);
    revalidatePath("/admin/settings");
    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.issues[0];
      return {
        success: false,
        error: first?.message ?? "Invalid settings",
      };
    }
    console.error("updateSupportNotificationSettingsAction:", error);
    return { success: false, error: "Failed to save settings" };
  }
}
