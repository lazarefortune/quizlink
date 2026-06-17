import { DEFAULT_AVATAR_BACKGROUND_COLOR } from "./bigEarsOptionValues";
import { deserializeUserAvatarConfig } from "./userAvatarConfigSchema";

type UserAvatarRecord = {
  avatar: string | null;
  avatarConfig: string | null;
};

export type UserAvatarDisplay = {
  avatar: string | null;
  backgroundColor: string;
};

export function resolveUserAvatarDisplay(user: UserAvatarRecord): UserAvatarDisplay {
  const config = deserializeUserAvatarConfig(user.avatarConfig);

  return {
    avatar: user.avatar,
    backgroundColor: config?.backgroundColor ?? DEFAULT_AVATAR_BACKGROUND_COLOR,
  };
}
