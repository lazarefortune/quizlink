"use server";

import { cookies } from "next/headers";

import { TIME_ZONE_COOKIE, TIME_ZONE_COOKIE_MAX_AGE } from "./constants";
import { isValidTimeZone } from "./timezone";

export async function syncTimeZoneAction(
  timeZone: string,
): Promise<{ success: boolean }> {
  if (!isValidTimeZone(timeZone)) {
    return { success: false };
  }

  const cookieStore = await cookies();
  cookieStore.set(TIME_ZONE_COOKIE, timeZone, {
    path: "/",
    maxAge: TIME_ZONE_COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
  });

  return { success: true };
}
