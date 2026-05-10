import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getAppSetting(key: string): Promise<Prisma.JsonValue | null> {
  const row = await prisma.appSetting.findUnique({
    where: { key },
    select: { value: true },
  });
  return row?.value ?? null;
}

export async function upsertAppSetting(
  key: string,
  value: Prisma.InputJsonValue,
): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });
}
