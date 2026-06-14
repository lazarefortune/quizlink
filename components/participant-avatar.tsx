import { AvatarSvgDisplay } from "@/components/user-avatar/avatar-svg-display";
import { cn } from "@/lib/utils";

type ParticipantAvatarProps = {
  avatar?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export function ParticipantAvatar({
  avatar,
  name,
  size = "md",
  className,
}: ParticipantAvatarProps) {
  const sizeClass = sizeClasses[size];

  // If avatar SVG exists, display it
  if (avatar) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted",
          sizeClass,
          className
        )}
      >
        <AvatarSvgDisplay svg={avatar} className="h-full w-full" />
      </div>
    );
  }

  // Fallback: show initials
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0",
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  );
}
