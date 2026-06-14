import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type QuizDetailKpiIconProps = {
  className?: string;
};

const kpiPlayfulColors = {
  purple: "#CE82FF",
  purpleAccent: "#9333EA",
  gold: "#FFC800",
  green: "#58CC02",
  greenAccent: "#2D6B01",
  blue: "#1CB0F6",
  blueAccent: "#0E5C82",
  orange: "#FF9600",
  muted: "#7A7A7A",
} as const;

function QuizDetailKpiSvg24({
  className,
  children,
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-8 w-8 shrink-0", className)}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

function QuizDetailKpiStarIcon({
  className,
  fill,
}: QuizDetailKpiIconProps & { fill: string }) {
  return (
    <QuizDetailKpiSvg24 className={className}>
      <path
        d="M9.15316 5.40838C10.4198 3.13613 11.0531 2 12 2C12.9469 2 13.5802 3.13612 14.8468 5.40837L15.1745 5.99623C15.5345 6.64193 15.7144 6.96479 15.9951 7.17781C16.2757 7.39083 16.6251 7.4699 17.3241 7.62805L17.9605 7.77203C20.4201 8.32856 21.65 8.60682 21.9426 9.54773C22.2352 10.4886 21.3968 11.4691 19.7199 13.4299L19.2861 13.9372C18.8096 14.4944 18.5713 14.773 18.4641 15.1177C18.357 15.4624 18.393 15.8341 18.465 16.5776L18.5306 17.2544C18.7841 19.8706 18.9109 21.1787 18.1449 21.7602C17.3788 22.3417 16.2273 21.8115 13.9243 20.7512L13.3285 20.4768C12.6741 20.1755 12.3469 20.0248 12 20.0248C11.6531 20.0248 11.3259 20.1755 10.6715 20.4768L10.0757 20.7512C7.77268 21.8115 6.62118 22.3417 5.85515 21.7602C5.08912 21.1787 5.21588 19.8706 5.4694 17.2544L5.53498 16.5776C5.60703 15.8341 5.64305 15.4624 5.53586 15.1177C5.42868 14.773 5.19043 14.4944 4.71392 13.9372L4.2801 13.4299C2.60325 11.4691 1.76482 10.4886 2.05742 9.54773C2.35002 8.60682 3.57986 8.32856 6.03954 7.77203L6.67589 7.62805C7.37485 7.4699 7.72433 7.39083 8.00494 7.17781C8.28555 6.96479 8.46553 6.64194 8.82547 5.99623L9.15316 5.40838Z"
        fill={fill}
      />
    </QuizDetailKpiSvg24>
  );
}

export function QuizDetailKpiGamesIcon({ className }: QuizDetailKpiIconProps) {
  return (
    <QuizDetailKpiSvg24 className={className}>
      <path
        opacity="0.4"
        d="M22 11.07V16.65C22 19.6 19.6 22 16.65 22H7.35C4.4 22 2 19.6 2 16.65V11.07C2 8.11997 4.4 5.71997 7.35 5.71997H16.65C19.6 5.71997 22 8.11997 22 11.07Z"
        fill="var(--kpi-game-soft)"
      />
      <path
        d="M10.1309 15.0099L9.10094 13.9799L10.0909 12.9899C10.3809 12.6999 10.3809 12.2199 10.0909 11.9299C9.80094 11.6399 9.32094 11.6399 9.03094 11.9299L8.04094 12.9199L7.08094 11.9599C6.79094 11.6699 6.31094 11.6699 6.02094 11.9599C5.73094 12.2499 5.73094 12.7299 6.02094 13.0199L6.98094 13.9799L5.99094 14.9699C5.70094 15.2599 5.70094 15.7399 5.99094 16.0299C6.14094 16.1799 6.33094 16.2499 6.52094 16.2499C6.71094 16.2499 6.90094 16.1799 7.05094 16.0299L8.04094 15.0399L9.07094 16.0699C9.22094 16.2199 9.41094 16.2899 9.60094 16.2899C9.79094 16.2899 9.98094 16.2199 10.1309 16.0699C10.4209 15.7799 10.4209 15.2999 10.1309 15.0099Z"
        fill="var(--kpi-game-solid)"
      />
      <path
        d="M13.5393 15C12.9893 15 12.5293 14.55 12.5293 14C12.5293 13.45 12.9693 13 13.5193 13H13.5393C14.0893 13 14.5393 13.45 14.5393 14C14.5393 14.55 14.0993 15 13.5393 15Z"
        fill="var(--kpi-game-solid)"
      />
      <path
        d="M17.4807 15C16.9307 15 16.4707 14.55 16.4707 14C16.4707 13.45 16.9107 13 17.4607 13H17.4807C18.0307 13 18.4807 13.45 18.4807 14C18.4807 14.55 18.0407 15 17.4807 15Z"
        fill="var(--kpi-game-solid)"
      />
      <path
        d="M15.5 16.97C14.95 16.97 14.5 16.53 14.5 15.98V15.96C14.5 15.41 14.95 14.96 15.5 14.96C16.05 14.96 16.5 15.41 16.5 15.96C16.5 16.51 16.06 16.97 15.5 16.97Z"
        fill="var(--kpi-game-solid)"
      />
      <path
        d="M15.5 13.03C14.95 13.03 14.5 12.59 14.5 12.04V12.02C14.5 11.47 14.95 11.02 15.5 11.02C16.05 11.02 16.5 11.47 16.5 12.02C16.5 12.57 16.06 13.03 15.5 13.03Z"
        fill="var(--kpi-game-solid)"
      />
      <path
        d="M13.6394 2.71L13.6294 3.65C13.6194 4.53 12.8894 5.26 11.9994 5.26C11.8494 5.26 11.7594 5.36 11.7594 5.49C11.7594 5.62 11.8594 5.72 11.9894 5.72H10.3794C10.3694 5.65 10.3594 5.57 10.3594 5.49C10.3594 4.59 11.0894 3.86 11.9794 3.86C12.1294 3.86 12.2294 3.76 12.2294 3.63L12.2394 2.69C12.2494 2.31 12.5594 2 12.9394 2H12.9494C13.3394 2 13.6394 2.32 13.6394 2.71Z"
        fill="var(--kpi-game-solid)"
      />
    </QuizDetailKpiSvg24>
  );
}

export function QuizDetailKpiAverageScoreIcon({ className }: QuizDetailKpiIconProps) {
  return (
    <QuizDetailKpiStarIcon className={className} fill={kpiPlayfulColors.gold} />
  );
}

export function QuizDetailKpiCompletionIcon({ className }: QuizDetailKpiIconProps) {
  return (
    <QuizDetailKpiSvg24 viewBox="0 0 64 64" className={className}>
      <rect x="15" y="33" width="10" height="23" rx="3" fill={kpiPlayfulColors.green} opacity="0.45" />
      <rect x="28" y="26" width="10" height="30" rx="3" fill={kpiPlayfulColors.green} opacity="0.7" />
      <rect x="41" y="19" width="10" height="37" rx="3" fill={kpiPlayfulColors.green} />
      <path
        stroke={kpiPlayfulColors.greenAccent}
        strokeLinecap="round"
        strokeWidth="2"
        fill="none"
        d="M10.4868562,28.2544738 C10.4868562,28.2544738 29.9645832,22.8690471 40.558199,9.75941372"
      />
      <polygon
        fill={kpiPlayfulColors.greenAccent}
        points="43.132 1.632 49.132 12.632 37.132 12.632"
        transform="rotate(45 43.132 7.132)"
      />
      <rect x="3" y="58" width="57" height="3" fill={kpiPlayfulColors.greenAccent} opacity="0.45" />
    </QuizDetailKpiSvg24>
  );
}

export function QuizDetailKpiDurationIcon({ className }: QuizDetailKpiIconProps) {
  return (
    <QuizDetailKpiSvg24 className={className}>
      <path
        opacity="0.45"
        d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
        fill="var(--kpi-clock-soft)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 7.25C12.4142 7.25 12.75 7.58579 12.75 8V11.6893L15.0303 13.9697C15.3232 14.2626 15.3232 14.7374 15.0303 15.0303C14.7374 15.3232 14.2626 15.3232 13.9697 15.0303L11.4697 12.5303C11.329 12.3897 11.25 12.1989 11.25 12V8C11.25 7.58579 11.5858 7.25 12 7.25Z"
        fill="var(--kpi-clock-solid)"
      />
    </QuizDetailKpiSvg24>
  );
}

export function QuizDetailKpiAnonymousIcon({ className }: QuizDetailKpiIconProps) {
  return (
    <QuizDetailKpiSvg24 className={className}>
      <path
        opacity="0.5"
        d="M2 12C2 13.6394 2.42496 14.1915 3.27489 15.2957C4.97196 17.5004 7.81811 20 12 20C16.1819 20 19.028 17.5004 20.7251 15.2957C21.575 14.1915 22 13.6394 22 12C22 10.3606 21.575 9.80853 20.7251 8.70433C19.028 6.49956 16.1819 4 12 4C7.81811 4 4.97196 6.49956 3.27489 8.70433C2.42496 9.80853 2 10.3606 2 12Z"
        fill={kpiPlayfulColors.purple}
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.25 12C8.25 9.92893 9.92893 8.25 12 8.25C14.0711 8.25 15.75 9.92893 15.75 12C15.75 14.0711 14.0711 15.75 12 15.75C9.92893 15.75 8.25 14.0711 8.25 12ZM9.75 12C9.75 10.7574 10.7574 9.75 12 9.75C13.2426 9.75 14.25 10.7574 14.25 12C14.25 13.2426 13.2426 14.25 12 14.25C10.7574 14.25 9.75 13.2426 9.75 12Z"
        fill={kpiPlayfulColors.purpleAccent}
      />
    </QuizDetailKpiSvg24>
  );
}

export function QuizDetailKpiOpensIcon({ className }: QuizDetailKpiIconProps) {
  return (
    <QuizDetailKpiSvg24 className={className}>
      <path
        opacity="0.45"
        d="M10.8939 22H13.1061C16.5526 22 18.2759 22 19.451 20.9882C20.626 19.9764 20.8697 18.2827 21.3572 14.8952L21.6359 12.9579C22.0154 10.3208 22.2051 9.00229 21.6646 7.87495C21.1242 6.7476 19.9738 6.06234 17.6731 4.69182L17.6731 4.69181L16.2882 3.86687C14.199 2.62229 13.1543 2 12 2C10.8457 2 9.80104 2.62229 7.71175 3.86687L6.32691 4.69181L6.32691 4.69181C4.02619 6.06234 2.87583 6.7476 2.33537 7.87495C1.79491 9.00229 1.98463 10.3208 2.36407 12.9579L2.64284 14.8952C3.13025 18.2827 3.37396 19.9764 4.54903 20.9882C5.72409 22 7.44737 22 10.8939 22Z"
        fill={kpiPlayfulColors.blue}
      />
      <path
        d="M9.44666 15.397C9.11389 15.1504 8.64418 15.2202 8.39752 15.5529C8.15086 15.8857 8.22067 16.3554 8.55343 16.6021C9.52585 17.3229 10.7151 17.7496 12 17.7496C13.285 17.7496 14.4742 17.3229 15.4467 16.6021C15.7794 16.3554 15.8492 15.8857 15.6026 15.5529C15.3559 15.2202 14.8862 15.1504 14.5534 15.397C13.8251 15.9369 12.9459 16.2496 12 16.2496C11.0541 16.2496 10.175 15.9369 9.44666 15.397Z"
        fill={kpiPlayfulColors.blueAccent}
      />
    </QuizDetailKpiSvg24>
  );
}

export function QuizDetailKpiStartedIcon({ className }: QuizDetailKpiIconProps) {
  return (
    <QuizDetailKpiSvg24 className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13 11C13 10.4477 12.5523 10 12 10C11.4477 10 11 10.4477 11 11V12.5L9.5 12.5C8.94772 12.5 8.5 12.9477 8.5 13.5C8.5 14.0523 8.94772 14.5 9.5 14.5L11 14.5V16C11 16.5523 11.4477 17 12 17C12.5523 17 13 16.5523 13 16V14.5L14.5 14.5C15.0523 14.5 15.5 14.0523 15.5 13.5C15.5 12.9477 15.0523 12.5 14.5 12.5L13 12.5V11ZM5.41959 3.23866C6.23018 3.05852 7.19557 3 8.312 3H9.92963C10.9327 3 11.8694 3.5013 12.4258 4.3359L13.2383 5.5547C13.4238 5.83288 13.736 6 14.0704 6H19.1258C20.7233 6 22.0181 7.26115 22.0029 8.8852C21.9847 10.8192 22 12.7539 22 14.688C22 15.8044 21.9415 16.7698 21.7613 17.5804C21.5787 18.4024 21.2579 19.1251 20.6915 19.6915C20.1251 20.2579 19.4024 20.5787 18.5804 20.7613C17.7698 20.9415 16.8044 21 15.688 21H8.312C7.19557 21 6.23018 20.9415 5.41959 20.7613C4.59764 20.5787 3.87488 20.2579 3.30848 19.6915C2.74209 19.1251 2.42133 18.4024 2.23866 17.5804C2.05852 16.7698 2 15.8044 2 14.688V9.312C2 8.19557 2.05852 7.23018 2.23866 6.41959C2.42133 5.59764 2.74209 4.87488 3.30848 4.30848C3.87488 3.74209 4.59764 3.42133 5.41959 3.23866Z"
        fill={kpiPlayfulColors.orange}
      />
    </QuizDetailKpiSvg24>
  );
}

export function QuizDetailKpiBestScoreIcon({ className }: QuizDetailKpiIconProps) {
  return (
    <QuizDetailKpiStarIcon className={className} fill={kpiPlayfulColors.gold} />
  );
}

export function QuizDetailKpiWorstScoreIcon({ className }: QuizDetailKpiIconProps) {
  return (
    <QuizDetailKpiStarIcon className={className} fill={kpiPlayfulColors.muted} />
  );
}
