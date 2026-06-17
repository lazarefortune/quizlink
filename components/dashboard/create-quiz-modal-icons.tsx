import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type CreateQuizModalIconProps = {
  className?: string;
};

function CreateQuizModalSvg({
  className,
  children,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("shrink-0", className)}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function CreateQuizManualIcon({ className }: CreateQuizModalIconProps) {
  return (
    <CreateQuizModalSvg className={className}>
      <g transform="translate(50 50)">
        <rect
          x="-24"
          y="-30"
          width="48"
          height="60"
          rx="6"
          fill="#FFFFFF"
          stroke="#1CB0F6"
          strokeWidth="5"
        />
        <rect x="-16" y="-18" width="32" height="8" rx="3" fill="#1CB0F6" />
        <rect x="-16" y="-4" width="24" height="6" rx="2" fill="#CE82FF" />
        <rect x="-16" y="8" width="28" height="6" rx="2" fill="#CE82FF" />
        <rect x="-16" y="20" width="18" height="6" rx="2" fill="#CE82FF" />
      </g>
    </CreateQuizModalSvg>
  );
}

export function CreateQuizAiIcon({ className }: CreateQuizModalIconProps) {
  return (
    <CreateQuizModalSvg className={className}>
      <path
        d="M50 14 L56 36 L78 40 L60 54 L66 78 L50 66 L34 78 L40 54 L22 40 L44 36 Z"
        fill="#FFC800"
        stroke="#CD7900"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <circle cx="72" cy="24" r="8" fill="#CE82FF" stroke="#6B2D9C" strokeWidth="4" />
      <circle cx="24" cy="28" r="6" fill="#1CB0F6" stroke="#0E5C82" strokeWidth="4" />
    </CreateQuizModalSvg>
  );
}
