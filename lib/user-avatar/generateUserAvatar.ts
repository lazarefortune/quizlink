import { createAvatar } from "@dicebear/core";
import { bigEars } from "@dicebear/collection";

import { toDiceBearAvatarOptions } from "./toDiceBearAvatarOptions";
import type { UserAvatarConfig } from "./userAvatarConfigSchema";

export function generateUserAvatar(config: UserAvatarConfig): string {
  const options = toDiceBearAvatarOptions(config.options);

  const avatar = createAvatar(bigEars, {
    seed: config.seed,
    ...options,
  });

  return avatar.toString();
}
