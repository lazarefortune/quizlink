"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";
import { useLocale } from "@/lib/i18n/use-locale";
import { identify, resetIdentify } from "@/lib/analytics/identify";

export function PostHogIdentify(): null {
  const { data: session, status } = useSession();
  const { locale } = useLocale();
  const lastIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user?.id) {
      if (lastIdRef.current !== null) {
        resetIdentify();
        lastIdRef.current = null;
      }
      return;
    }

    const userId = session.user.id;
    if (lastIdRef.current === userId) return;
    lastIdRef.current = userId;

    const user = session.user as {
      email?: string;
      name?: string;
      role?: string;
      coinBalance?: number;
    };
    const role = user.role === "ADMIN" ? "ADMIN" : "USER";
    identify(userId, {
      email: user.email ?? undefined,
      name: user.name ?? undefined,
      role,
      preferredLanguage: locale === "fr" || locale === "en" ? locale : undefined,
      coinsBalance: typeof user.coinBalance === "number" ? user.coinBalance : undefined,
    });
  }, [session?.user?.id, session?.user?.email, session?.user?.name, session?.user?.coinBalance, status, locale]);

  return null;
}
