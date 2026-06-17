import { prisma } from "@/lib/prisma";

import { createDefaultUserAvatarConfig } from "./defaultUserAvatarConfig";
import { generateUserAvatar } from "./generateUserAvatar";
import {
  deserializeUserAvatarConfig,
  serializeUserAvatarConfig,
} from "./userAvatarConfigSchema";

export type EnsureDefaultUserAvatarResult = {
  avatar: string;
  avatarConfig: string;
};

export async function ensureDefaultUserAvatar(
  userId: string,
): Promise<EnsureDefaultUserAvatarResult | null> {
  if (!prisma) {
    return null;
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true, avatarConfig: true },
  });

  if (!existingUser) {
    return null;
  }

  if (existingUser.avatar && existingUser.avatarConfig) {
    return {
      avatar: existingUser.avatar,
      avatarConfig: existingUser.avatarConfig,
    };
  }

  const storedConfig = deserializeUserAvatarConfig(existingUser.avatarConfig);
  const config = storedConfig ?? createDefaultUserAvatarConfig(userId);
  const avatar = existingUser.avatar ?? generateUserAvatar(config);
  const avatarConfig =
    existingUser.avatarConfig ?? serializeUserAvatarConfig(config);

  if (existingUser.avatar === avatar && existingUser.avatarConfig === avatarConfig) {
    return { avatar, avatarConfig };
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatar, avatarConfig },
    select: { avatar: true, avatarConfig: true },
  });

  if (!updatedUser.avatar || !updatedUser.avatarConfig) {
    return null;
  }

  return {
    avatar: updatedUser.avatar,
    avatarConfig: updatedUser.avatarConfig,
  };
}
