/**
 * Seed realistic dev users and auth/lifecycle events for admin dashboards.
 * Usage: pnpm run seed:dev-users
 */

import bcrypt from "bcryptjs";

import { prisma } from "../lib/prisma";
import { USER_AUTH_EVENT_TYPES, USER_AUTH_PROVIDERS } from "../lib/userAuthEvents";
import { USER_LIFECYCLE_EVENT_TYPES } from "../lib/userLifecycleEvents";

async function seedDevUsers(): Promise<void> {
  if (!prisma) {
    throw new Error("Prisma client not initialized");
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  const today = new Date();
  const usersToCreate = 60;

  for (let index = 1; index <= usersToCreate; index += 1) {
    const createdAt = new Date(today);
    createdAt.setDate(today.getDate() - Math.floor(Math.random() * 45));

    const lastLoginAt = new Date(createdAt);
    lastLoginAt.setDate(createdAt.getDate() + Math.floor(Math.random() * 10));

    const email = `dev-user-${index}@quizsnap.local`;
    const hasGoogle = index % 3 === 0;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      continue;
    }

    const user = await prisma.user.create({
      data: {
        email,
        name: `Dev User ${index}`,
        passwordHash: hasGoogle ? null : passwordHash,
        googleId: hasGoogle ? `google-dev-${index}` : null,
        emailVerifiedAt: createdAt,
        coinBalance: Math.floor(Math.random() * 200),
        lastLoginAt,
        createdAt,
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    await prisma.userLifecycleEvent.create({
      data: {
        userId: user.id,
        eventType: USER_LIFECYCLE_EVENT_TYPES.SIGNUP,
        createdAt: user.createdAt,
      },
    });

    const successfulLogins = Math.floor(Math.random() * 8) + 1;
    for (let loginIndex = 0; loginIndex < successfulLogins; loginIndex += 1) {
      const createdAtLogin = new Date(today);
      createdAtLogin.setDate(today.getDate() - Math.floor(Math.random() * 30));

      await prisma.userAuthEvent.create({
        data: {
          userId: user.id,
          eventType: USER_AUTH_EVENT_TYPES.LOGIN_SUCCESS,
          authProvider: hasGoogle ? USER_AUTH_PROVIDERS.GOOGLE : USER_AUTH_PROVIDERS.CREDENTIALS,
          createdAt: createdAtLogin,
          userAgent: "DevSeeder/1.0",
        },
      });
    }

    const failedLogins = Math.floor(Math.random() * 4);
    for (let failIndex = 0; failIndex < failedLogins; failIndex += 1) {
      const createdAtFailure = new Date(today);
      createdAtFailure.setDate(today.getDate() - Math.floor(Math.random() * 30));

      await prisma.userAuthEvent.create({
        data: {
          userId: user.id,
          eventType: USER_AUTH_EVENT_TYPES.LOGIN_FAILURE,
          authProvider: hasGoogle ? USER_AUTH_PROVIDERS.GOOGLE : USER_AUTH_PROVIDERS.CREDENTIALS,
          failureReason: "CREDENTIALS_REJECTED",
          createdAt: createdAtFailure,
          userAgent: "DevSeeder/1.0",
        },
      });
    }
  }

  console.log(`✅ Seeded ${usersToCreate} dev users with lifecycle and auth events.`);
}

seedDevUsers()
  .catch((error) => {
    console.error("❌ Error seeding dev users:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
