import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

export const dashboardNavIconClassName = "h-7 w-7 shrink-0";

type DashboardNavSvgProps = SVGProps<SVGSVGElement>;

export function DashboardNavSvg({ className, children, ...props }: DashboardNavSvgProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn(dashboardNavIconClassName, className)}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}
