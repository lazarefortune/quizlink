import { DEFAULT_AVATAR_BACKGROUND_COLOR } from "./bigEarsOptionValues";
import type { UserAvatarConfig } from "./userAvatarConfigSchema";

export function createDefaultUserAvatarConfig(userId: string): UserAvatarConfig {
  return {
    seed: userId,
    backgroundColor: DEFAULT_AVATAR_BACKGROUND_COLOR,
    options: {},
  };
}
