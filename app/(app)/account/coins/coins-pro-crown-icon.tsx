import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type CoinsProCrownIconProps = {
  className?: string;
};

function CoinsProCrownSvg({
  className,
  children,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 96 88"
      className={cn("shrink-0", className)}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function CoinsProCrownIcon({ className }: CoinsProCrownIconProps) {
  return (
    <CoinsProCrownSvg className={className}>
      <ellipse cx="78" cy="14" rx="5" ry="5" fill="#FDE047" opacity="0.9" />
      <ellipse cx="18" cy="22" rx="4" ry="4" fill="#FDE047" opacity="0.75" />
      <path
        d="M12 58 L24 30 L36 46 L48 22 L60 46 L72 30 L84 58 Z"
        fill="#FBBF24"
        stroke="#D97706"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect
        x="10"
        y="56"
        width="76"
        height="18"
        rx="6"
        fill="#F59E0B"
        stroke="#D97706"
        strokeWidth="4"
      />
      <circle cx="30" cy="65" r="5" fill="#FEF08A" stroke="#D97706" strokeWidth="2" />
      <circle cx="48" cy="65" r="6" fill="#FDE047" stroke="#D97706" strokeWidth="2" />
      <circle cx="66" cy="65" r="5" fill="#FEF08A" stroke="#D97706" strokeWidth="2" />
    </CoinsProCrownSvg>
  );
}
