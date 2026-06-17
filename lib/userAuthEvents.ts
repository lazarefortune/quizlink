import type { Prisma, PrismaClient } from "@/generated/prisma/client";

import type { AuthAuditFields } from "@/lib/authAuditContext";

export const USER_AUTH_EVENT_TYPES = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
} as const;

export type UserAuthEventType = (typeof USER_AUTH_EVENT_TYPES)[keyof typeof USER_AUTH_EVENT_TYPES];

export const USER_AUTH_PROVIDERS = {
  CREDENTIALS: "credentials",
  GOOGLE: "google",
} as const;

export type UserAuthProvider = (typeof USER_AUTH_PROVIDERS)[keyof typeof USER_AUTH_PROVIDERS];

type UserAuthEventWriter = Pick<PrismaClient, "userAuthEvent"> | Prisma.TransactionClient;

export async function recordUserAuthEvent(
  db: UserAuthEventWriter,
  params: {
    userId: string | null;
    eventType: UserAuthEventType;
    authProvider: UserAuthProvider | null;
    audit: AuthAuditFields;
    failureReason?: string | null;
  }
): Promise<void> {
  await db.userAuthEvent.create({
    data: {
      userId: params.userId,
      eventType: params.eventType,
      authProvider: params.authProvider,
      ipAddressHash: params.audit.ipAddressHash,
      userAgent: params.audit.userAgent,
      failureReason: params.failureReason ?? null,
    },
  });
}

export async function persistSuccessfulLogin(
  db: PrismaClient,
  params: {
    userId: string;
    authProvider: UserAuthProvider;
    audit: AuthAuditFields;
  }
): Promise<void> {
  await db.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.userAuthEvent.create({
      data: {
        userId: params.userId,
        eventType: USER_AUTH_EVENT_TYPES.LOGIN_SUCCESS,
        authProvider: params.authProvider,
        ipAddressHash: params.audit.ipAddressHash,
        userAgent: params.audit.userAgent,
      },
    });

    await tx.user.update({
      where: { id: params.userId },
      data: { lastLoginAt: new Date() },
    });
  });
}
