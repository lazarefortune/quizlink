import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type ParticipantIdentityModeIconProps = {
  className?: string;
};

function ParticipantIdentityModeSvg24({
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

export function ParticipantIdentityAnonymousIcon({
  className,
}: ParticipantIdentityModeIconProps) {
  return (
    <ParticipantIdentityModeSvg24 className={className}>
      <path
        opacity="0.4"
        d="M21.2496 9.15004C20.7596 8.37004 20.1996 7.67004 19.6196 7.04004L15.8496 10.81C15.9696 11.18 16.0396 11.58 16.0396 12C16.0396 14.24 14.2296 16.04 11.9996 16.04C11.5796 16.04 11.1796 15.97 10.8096 15.85L7.34961 19.31C8.80961 20.13 10.3896 20.56 11.9996 20.56C13.7796 20.56 15.5096 20.04 17.0896 19.07C18.6696 18.09 20.0896 16.66 21.2496 14.84C22.2496 13.28 22.2496 10.72 21.2496 9.15004Z"
        fill="var(--participant-mode-anonymous-soft)"
      />
      <path
        d="M14.0206 9.97989L9.98062 14.0199C9.47062 13.4999 9.14062 12.7799 9.14062 11.9999C9.14062 10.4299 10.4206 9.13989 12.0006 9.13989C12.7806 9.13989 13.5006 9.46989 14.0206 9.97989Z"
        fill="var(--participant-mode-anonymous-solid)"
      />
      <path
        opacity="0.4"
        d="M18.25 5.74993L14.86 9.13993C14.13 8.39993 13.12 7.95993 12 7.95993C9.76 7.95993 7.96 9.76993 7.96 11.9999C7.96 13.1199 8.41 14.1299 9.14 14.8599L5.76 18.2499H5.75C4.64 17.3499 3.62 16.1999 2.75 14.8399C1.75 13.2699 1.75 10.7199 2.75 9.14993C3.91 7.32993 5.33 5.89993 6.91 4.91993C8.49 3.95993 10.22 3.42993 12 3.42993C14.23 3.42993 16.39 4.24993 18.25 5.74993Z"
        fill="var(--participant-mode-anonymous-soft)"
      />
      <path
        d="M14.8601 12.0001C14.8601 13.5701 13.5801 14.8601 12.0001 14.8601C11.9401 14.8601 11.8901 14.8601 11.8301 14.8401L14.8401 11.8301C14.8601 11.8901 14.8601 11.9401 14.8601 12.0001Z"
        fill="var(--participant-mode-anonymous-solid)"
      />
      <path
        d="M21.7709 2.22988C21.4709 1.92988 20.9809 1.92988 20.6809 2.22988L2.23086 20.6899C1.93086 20.9899 1.93086 21.4799 2.23086 21.7799C2.38086 21.9199 2.57086 21.9999 2.77086 21.9999C2.97086 21.9999 3.16086 21.9199 3.31086 21.7699L21.7709 3.30988C22.0809 3.00988 22.0809 2.52988 21.7709 2.22988Z"
        fill="var(--participant-mode-anonymous-solid)"
      />
    </ParticipantIdentityModeSvg24>
  );
}

export function ParticipantIdentityPseudonymIcon({
  className,
}: ParticipantIdentityModeIconProps) {
  return (
    <ParticipantIdentityModeSvg24 className={className}>
      <circle cx="12" cy="6" r="4" fill="var(--participant-mode-pseudonym-solid)" />
      <path
        opacity="0.5"
        d="M20 17.5C20 19.9853 20 22 12 22C4 22 4 19.9853 4 17.5C4 15.0147 7.58172 13 12 13C16.4183 13 20 15.0147 20 17.5Z"
        fill="var(--participant-mode-pseudonym-soft)"
      />
    </ParticipantIdentityModeSvg24>
  );
}

export function ParticipantIdentityNameEmailIcon({
  className,
}: ParticipantIdentityModeIconProps) {
  return (
    <ParticipantIdentityModeSvg24 className={className}>
      <path
        opacity="0.5"
        d="M14.2 3H9.8C5.65164 3 3.57746 3 2.28873 4.31802C1 5.63604 1 7.75736 1 12C1 16.2426 1 18.364 2.28873 19.682C3.57746 21 5.65164 21 9.8 21H14.2C18.3484 21 20.4225 21 21.7113 19.682C23 18.364 23 16.2426 23 12C23 7.75736 23 5.63604 21.7113 4.31802C20.4225 3 18.3484 3 14.2 3Z"
        fill="var(--participant-mode-name-email-soft)"
      />
      <path
        d="M19.1284 8.03302C19.4784 7.74133 19.5257 7.22112 19.234 6.87109C18.9423 6.52106 18.4221 6.47377 18.0721 6.76546L15.6973 8.74444C14.671 9.59966 13.9585 10.1915 13.357 10.5784C12.7747 10.9529 12.3798 11.0786 12.0002 11.0786C11.6206 11.0786 11.2258 10.9529 10.6435 10.5784C10.0419 10.1915 9.32941 9.59966 8.30315 8.74444L5.92837 6.76546C5.57834 6.47377 5.05812 6.52106 4.76643 6.87109C4.47474 7.22112 4.52204 7.74133 4.87206 8.03302L7.28821 10.0465C8.2632 10.859 9.05344 11.5176 9.75091 11.9661C10.4775 12.4334 11.185 12.7286 12.0002 12.7286C12.8154 12.7286 13.523 12.4334 14.2495 11.9661C14.947 11.5176 15.7372 10.859 16.7122 10.0465L19.1284 8.03302Z"
        fill="var(--participant-mode-name-email-solid)"
      />
    </ParticipantIdentityModeSvg24>
  );
}
