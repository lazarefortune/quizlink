import { dashboardNavPlayfulColors } from "@/components/dashboard/nav-icons/dashboard-nav-colors";
import { DashboardNavSvg } from "@/components/dashboard/nav-icons/DashboardNavSvg";
import { feedbackStarPath } from "@/components/dashboard/nav-icons/feedback-star-path";

type DashboardFeedbackNavIconProps = {
  className?: string;
};

export function DashboardFeedbackNavIcon({ className }: DashboardFeedbackNavIconProps) {
  return (
    <DashboardNavSvg className={className}>
      <path d={feedbackStarPath} fill={dashboardNavPlayfulColors.feedback} />
    </DashboardNavSvg>
  );
}
