import type { PrismaClient } from "@prisma/client";

export const USER_LIFECYCLE_EVENT_TYPES = {
  SIGNUP: "SIGNUP",
  ACCOUNT_DELETION: "ACCOUNT_DELETION",
} as const;

export type UserLifecycleEventType =
  (typeof USER_LIFECYCLE_EVENT_TYPES)[keyof typeof USER_LIFECYCLE_EVENT_TYPES];

type UserLifecycleEventDelegate = {
  create: (args: {
    data: {
      userId: string;
      eventType: UserLifecycleEventType;
    };
  }) => Promise<unknown>;
  count: (args: {
    where: {
      eventType: UserLifecycleEventType;
      createdAt?: {
        gte: Date;
      };
    };
  }) => Promise<number>;
};

type UserLifecycleEventWriter = {
  userLifecycleEvent: Pick<UserLifecycleEventDelegate, "create">;
};

type UserLifecycleEventReader = {
  userLifecycleEvent: Pick<UserLifecycleEventDelegate, "count">;
};

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

export async function getTotalSignupsEver(db: UserLifecycleEventReader): Promise<number> {
  return db.userLifecycleEvent.count({
    where: {
      eventType: USER_LIFECYCLE_EVENT_TYPES.SIGNUP,
    },
  });
}

export async function getSignupsSince(db: UserLifecycleEventReader, startDate: Date): Promise<number> {
  return db.userLifecycleEvent.count({
    where: {
      eventType: USER_LIFECYCLE_EVENT_TYPES.SIGNUP,
      createdAt: {
        gte: startDate,
      },
    },
  });
}

export async function backfillMissingSignupEvents(
  db: Pick<PrismaClient, "$executeRaw">
): Promise<number> {
  return db.$executeRaw`
    INSERT INTO user_lifecycle_events (id, user_id, event_type, created_at)
    SELECT
      REPLACE(UUID(), '-', ''),
      u.id,
      ${USER_LIFECYCLE_EVENT_TYPES.SIGNUP},
      u.created_at
    FROM users u
    WHERE NOT EXISTS (
      SELECT 1
      FROM user_lifecycle_events ule
      WHERE ule.user_id = u.id
        AND ule.event_type = ${USER_LIFECYCLE_EVENT_TYPES.SIGNUP}
    )
  `;
}
