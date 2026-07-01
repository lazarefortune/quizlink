import { dashboardNavPlayfulColors } from "@/components/dashboard/nav-icons/dashboard-nav-colors";
import { feedbackStarPath } from "@/components/dashboard/nav-icons/feedback-star-path";
import { cn } from "@/lib/utils";

type FeedbackStarIconProps = {
  className?: string;
  isActive?: boolean;
};

export function FeedbackStarIcon({ className, isActive = false }: FeedbackStarIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-7 w-7 shrink-0", className)}
      aria-hidden
    >
      <path
        d={feedbackStarPath}
        fill={isActive ? dashboardNavPlayfulColors.feedback : "currentColor"}
        className={cn(!isActive && "text-muted-foreground/35")}
      />
    </svg>
  );
}
