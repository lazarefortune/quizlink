"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";

import { useBuilderNavigationGuard } from "@/components/dashboard/builder-navigation-guard-context";
import { dashboardNavIconClassName } from "@/components/dashboard/dashboard-nav-icons";
import { dashboardSidebarNavItemClassName } from "@/components/dashboard/dashboard-sidebar-nav-styles";
import { cn } from "@/lib/utils";

type NavItemProps = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  onClick?: () => void;
  className?: string;
  /** Desktop icon-only rail; keeps labels for screen readers */
  isCompact?: boolean;
};

export function NavItem({
  href,
  label,
  icon: Icon,
  onClick,
  className,
  isCompact = false,
}: NavItemProps) {
  const pathname = usePathname();
  const { interceptLinkClick } = useBuilderNavigationGuard();
  const isActive =
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      onClick={(event) => {
        if (interceptLinkClick(event, href)) {
          return;
        }
        onClick?.();
      }}
      className={cn(
        dashboardSidebarNavItemClassName({ isActive, isCompact }),
        className,
      )}
      title={isCompact ? label : undefined}
      aria-label={isCompact ? label : undefined}
    >
      <Icon className={dashboardNavIconClassName} />
      {isCompact ? null : label}
    </Link>
  );
}
