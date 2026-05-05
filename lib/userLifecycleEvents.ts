import type { Prisma, PrismaClient } from "@prisma/client";

export const USER_LIFECYCLE_EVENT_TYPES = {
  SIGNUP: "SIGNUP",
  ACCOUNT_DELETION: "ACCOUNT_DELETION",
} as const;

export type UserLifecycleEventType =
  (typeof USER_LIFECYCLE_EVENT_TYPES)[keyof typeof USER_LIFECYCLE_EVENT_TYPES];

type UserLifecycleEventWriter = Pick<PrismaClient, "userLifecycleEvent"> | Prisma.TransactionClient;

export async function recordUserLifecycleEvent(
  db: UserLifecycleEventWriter,
  userId: string,
  eventType: UserLifecycleEventType
): Promise<void> {
  await db.userLifecycleEvent.create({
    data: {
      userId,
      eventType,
    },
  });
}

export async function getTotalSignupsEver(db: Pick<PrismaClient, "userLifecycleEvent">): Promise<number> {
  return db.userLifecycleEvent.count({
    where: {
      eventType: USER_LIFECYCLE_EVENT_TYPES.SIGNUP,
    },
  });
}
