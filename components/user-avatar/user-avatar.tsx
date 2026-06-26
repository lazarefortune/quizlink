import { toCssHexColor } from "@/lib/user-avatar/avatarColorUtils";
import { DEFAULT_AVATAR_BACKGROUND_COLOR } from "@/lib/user-avatar/bigEarsOptionValues";
import { cn } from "@/lib/utils";
import { getUserInitials } from "@/lib/userProfileDisplay";

import { AvatarSvgDisplay } from "./avatar-svg-display";

type UserAvatarProps = {
  avatar?: string | null;
  name: string;
  email?: string;
  backgroundColor?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Square preview (editor) instead of circle */
  variant?: "circle" | "square";
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 sm:h-20 sm:w-20 text-xl sm:text-2xl",
};

export function UserAvatar({
  avatar,
  name,
  email = "",
  backgroundColor = DEFAULT_AVATAR_BACKGROUND_COLOR,
  size = "md",
  className,
  variant = "circle",
}: UserAvatarProps) {
  const sizeClass = sizeClasses[size];
  const initials = getUserInitials(name, email);
  const shapeClass = variant === "circle" ? "rounded-sm" : "rounded-3xl";
  const frameColor = toCssHexColor(backgroundColor ?? DEFAULT_AVATAR_BACKGROUND_COLOR);

  if (avatar) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden",
          shapeClass,
          sizeClass,
          className,
        )}
        style={{ backgroundColor: frameColor }}
      >
        <AvatarSvgDisplay svg={avatar} className="h-full w-full" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-blue/10 text-blue flex items-center justify-center font-bold shrink-0",
        shapeClass,
        sizeClass,
        className,
      )}
    >
      {initials}
    </div>
  );
}
