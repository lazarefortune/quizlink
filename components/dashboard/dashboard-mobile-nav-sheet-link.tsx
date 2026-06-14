"use client";

import type { ElementType } from "react";
import Link from "next/link";

import { dashboardNavIconClassName } from "@/components/dashboard/dashboard-nav-icons";
import { dashboardSidebarNavItemClassName } from "@/components/dashboard/dashboard-sidebar-nav-styles";
import { useBuilderNavigationGuard } from "@/components/dashboard/builder-navigation-guard-context";
import { SheetClose } from "@/components/ui/sheet";

type DashboardMobileNavSheetLinkProps = {
  href: string;
  icon: ElementType;
  label: string;
  isActive: boolean;
};

export function DashboardMobileNavSheetLink({
  href,
  icon: Icon,
  label,
  isActive,
}: DashboardMobileNavSheetLinkProps) {
  const { interceptLinkClick } = useBuilderNavigationGuard();

  return (
    <SheetClose asChild>
      <Link
        href={href}
        onClick={(event) => {
          interceptLinkClick(event, href);
        }}
        className={dashboardSidebarNavItemClassName({ isActive })}
      >
        <Icon className={dashboardNavIconClassName} />
        {label}
      </Link>
    </SheetClose>
  );
}
