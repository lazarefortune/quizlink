import type { ComponentType, SVGProps } from "react";

import {
  COINS_PAGE_PRO_BENEFIT_KEYS,
  type CoinsPageProBenefitKey,
} from "@/lib/subscription/proSubscriptionConstants";
import { cn } from "@/lib/utils";

type ProBenefitIconProps = {
  className?: string;
};

function ProBenefitSvg24({
  className,
  children,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-6 w-6 shrink-0", className)}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export function ProBenefitUnlockedQuizzesIcon({ className }: ProBenefitIconProps) {
  return (
    <ProBenefitSvg24 className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.7022 1.8145C13.327 1.21373 11.7908 1.08836 10.3364 1.4582C8.88201 1.82804 7.59233 2.672 6.67118 3.85671C5.75002 5.04142 5.24993 6.49932 5.24993 8C5.24993 8.41422 5.58572 8.75 5.99993 8.75C6.41415 8.75 6.74993 8.41422 6.74993 8C6.74993 6.8328 7.13889 5.69888 7.85535 4.77744C8.5718 3.856 9.57488 3.19959 10.7061 2.91193C11.8373 2.62428 13.0321 2.72179 14.1017 3.18906C15.1713 3.65633 16.0546 4.4667 16.6122 5.49212C16.8101 5.85602 17.2655 5.99061 17.6294 5.79275C17.9933 5.59488 18.1279 5.13948 17.93 4.77558C17.2131 3.45719 16.0774 2.41528 14.7022 1.8145Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.25 13C1.25 9.82436 3.82436 7.25 7 7.25H17C20.1756 7.25 22.75 9.82436 22.75 13V17C22.75 20.1756 20.1756 22.75 17 22.75H7C3.82436 22.75 1.25 20.1756 1.25 17V13Z"
        fill="currentColor"
        opacity="0.45"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.25 15C9.25 13.4812 10.4812 12.25 12 12.25C13.5188 12.25 14.75 13.4812 14.75 15C14.75 16.5188 13.5188 17.75 12 17.75C10.4812 17.75 9.25 16.5188 9.25 15Z"
        fill="currentColor"
      />
    </ProBenefitSvg24>
  );
}

export function ProBenefitAdvancedStatsIcon({ className }: ProBenefitIconProps) {
  return (
    <ProBenefitSvg24 viewBox="0 0 64 64" className={className}>
      <rect x="15" y="33" width="10" height="23" rx="3" fill="currentColor" opacity="0.45" />
      <rect x="28" y="26" width="10" height="30" rx="3" fill="currentColor" opacity="0.7" />
      <rect x="41" y="19" width="10" height="37" rx="3" fill="currentColor" />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
        fill="none"
        d="M10.4868562,28.2544738 C10.4868562,28.2544738 29.9645832,22.8690471 40.558199,9.75941372"
      />
      <polygon
        fill="currentColor"
        points="43.132 1.632 49.132 12.632 37.132 12.632"
        transform="rotate(45 43.132 7.132)"
      />
      <rect x="3" y="58" width="57" height="3" fill="currentColor" opacity="0.45" />
    </ProBenefitSvg24>
  );
}

export function ProBenefitViewResponsesIcon({ className }: ProBenefitIconProps) {
  return (
    <ProBenefitSvg24 className={className}>
      <path
        opacity="0.5"
        d="M2 12C2 13.6394 2.42496 14.1915 3.27489 15.2957C4.97196 17.5004 7.81811 20 12 20C16.1819 20 19.028 17.5004 20.7251 15.2957C21.575 14.1915 22 13.6394 22 12C22 10.3606 21.575 9.80853 20.7251 8.70433C19.028 6.49956 16.1819 4 12 4C7.81811 4 4.97196 6.49956 3.27489 8.70433C2.42496 9.80853 2 10.3606 2 12Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.25 12C8.25 9.92893 9.92893 8.25 12 8.25C14.0711 8.25 15.75 9.92893 15.75 12C15.75 14.0711 14.0711 15.75 12 15.75C9.92893 15.75 8.25 14.0711 8.25 12ZM9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12Z"
        fill="currentColor"
      />
    </ProBenefitSvg24>
  );
}

export function ProBenefitMonthlyCoinsIcon({ className }: ProBenefitIconProps) {
  return (
    <ProBenefitSvg24 className={className}>
      <path
        d="M12 22.7484C8 22.7484 4.75 19.8784 4.75 16.3484V12.6484C4.75 12.2384 5.09 11.8984 5.5 11.8984C5.91 11.8984 6.25 12.2384 6.25 12.6484C6.25 15.2684 8.72 17.2484 12 17.2484C15.28 17.2484 17.75 15.2684 17.75 12.6484C17.75 12.2384 18.09 11.8984 18.5 11.8984C18.91 11.8984 19.25 12.2384 19.25 12.6484V16.3484C19.25 19.8784 16 22.7484 12 22.7484ZM6.25 16.4584C6.32 19.1084 8.87 21.2484 12 21.2484C15.13 21.2484 17.68 19.1084 17.75 16.4584C16.45 17.8684 14.39 18.7484 12 18.7484C9.61 18.7484 7.56 17.8684 6.25 16.4584Z"
        fill="currentColor"
      />
      <path
        d="M12 13.75C9.24 13.75 6.75999 12.51 5.54999 10.51C5.02999 9.66 4.75 8.67 4.75 7.65C4.75 5.93 5.52 4.31 6.91 3.09C8.27 1.9 10.08 1.25 12 1.25C13.92 1.25 15.72 1.9 17.09 3.08C18.48 4.31 19.25 5.93 19.25 7.65C19.25 8.67 18.97 9.65 18.45 10.51C17.24 12.51 14.76 13.75 12 13.75ZM12 2.75C10.44 2.75 8.98001 3.27 7.89001 4.23C6.83001 5.15 6.25 6.37 6.25 7.65C6.25 8.4 6.44999 9.1 6.82999 9.73C7.77999 11.29 9.76 12.25 12 12.25C14.24 12.25 16.22 11.28 17.17 9.73C17.56 9.1 17.75 8.4 17.75 7.65C17.75 6.37 17.17 5.15 16.1 4.21C15.01 3.27 13.56 2.75 12 2.75Z"
        fill="currentColor"
      />
      <path
        d="M12 18.75C7.87 18.75 4.75 16.13 4.75 12.65V7.65C4.75 4.12 8 1.25 12 1.25C13.92 1.25 15.72 1.9 17.09 3.08C18.48 4.31 19.25 5.93 19.25 7.65V12.65C19.25 16.13 16.13 18.75 12 18.75ZM12 2.75C8.83 2.75 6.25 4.95 6.25 7.65V12.65C6.25 15.27 8.72 17.25 12 17.25C15.28 17.25 17.75 15.27 17.75 12.65V7.65C17.75 6.37 17.17 5.15 16.1 4.21C15.01 3.27 13.56 2.75 12 2.75Z"
        fill="currentColor"
      />
    </ProBenefitSvg24>
  );
}

const PRO_BENEFIT_ICON_MAP: Record<
  CoinsPageProBenefitKey,
  ComponentType<ProBenefitIconProps>
> = {
  "account.subscription.allQuizzesUnlocked": ProBenefitUnlockedQuizzesIcon,
  "account.subscription.advancedStatsAvailable": ProBenefitAdvancedStatsIcon,
  "dashboard.unlockDialog.benefitViewAllResponses": ProBenefitViewResponsesIcon,
  "account.subscription.monthlyCoinsIncluded": ProBenefitMonthlyCoinsIcon,
};

export function ProBenefitIcon({
  benefitKey,
  className,
}: ProBenefitIconProps & { benefitKey: CoinsPageProBenefitKey }) {
  const Icon = PRO_BENEFIT_ICON_MAP[benefitKey];
  return <Icon className={className} />;
}

export function getProBenefitIconKeys(): CoinsPageProBenefitKey[] {
  return [...COINS_PAGE_PRO_BENEFIT_KEYS];
}
