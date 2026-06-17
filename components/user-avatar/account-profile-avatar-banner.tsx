import { Pencil } from "lucide-react";

import { toCssHexColor } from "@/lib/user-avatar/avatarColorUtils";
import { DEFAULT_AVATAR_BACKGROUND_COLOR } from "@/lib/user-avatar/bigEarsOptionValues";
import { getUserInitials } from "@/lib/userProfileDisplay";
import { cn } from "@/lib/utils";

import { AvatarSvgDisplay } from "./avatar-svg-display";

type AccountProfileAvatarBannerProps = {
  avatar: string | null;
  backgroundColor: string;
  name: string;
  email: string;
  editLabel: string;
  onEdit: () => void;
  className?: string;
};

export function AccountProfileAvatarBanner({
  avatar,
  backgroundColor,
  name,
  email,
  editLabel,
  onEdit,
  className,
}: AccountProfileAvatarBannerProps) {
  const frameColor = toCssHexColor(
    backgroundColor ?? DEFAULT_AVATAR_BACKGROUND_COLOR,
  );
  const initials = getUserInitials(name, email);

  return (
    <div className={cn("flex justify-center", className)}>
      <button
        type="button"
        onClick={onEdit}
        className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={editLabel}
      >
        <div
          className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full shadow-inner transition-[filter] group-hover:brightness-[0.97] sm:h-36 sm:w-36"
          style={{ backgroundColor: frameColor }}
        >
          {avatar ? (
            <AvatarSvgDisplay svg={avatar} className="h-full w-full" />
          ) : (
            <span className="text-4xl font-black text-foreground/20 sm:text-5xl">
              {initials}
            </span>
          )}
        </div>

        <span
          className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-muted shadow-sm transition-colors group-hover:bg-muted/80"
          aria-hidden
        >
          <Pencil className="h-4 w-4 text-foreground/80" strokeWidth={2.25} />
        </span>
      </button>
    </div>
  );
}
