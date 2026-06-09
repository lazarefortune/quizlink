"use client";

import { createContext, useContext } from "react";

import { DEFAULT_AVATAR_BACKGROUND_COLOR } from "@/lib/user-avatar/bigEarsOptionValues";

type UserAvatarContextValue = {
  avatar: string | null;
  backgroundColor: string;
};

const UserAvatarContext = createContext<UserAvatarContextValue>({
  avatar: null,
  backgroundColor: DEFAULT_AVATAR_BACKGROUND_COLOR,
});

type UserAvatarProviderProps = {
  avatar: string | null;
  backgroundColor?: string;
  children: React.ReactNode;
};

export function UserAvatarProvider({
  avatar,
  backgroundColor = DEFAULT_AVATAR_BACKGROUND_COLOR,
  children,
}: UserAvatarProviderProps) {
  return (
    <UserAvatarContext.Provider value={{ avatar, backgroundColor }}>
      {children}
    </UserAvatarContext.Provider>
  );
}

export function useUserAvatar(): UserAvatarContextValue {
  return useContext(UserAvatarContext);
}
