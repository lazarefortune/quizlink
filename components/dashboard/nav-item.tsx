"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";

import { useBuilderNavigationGuard } from "@/components/dashboard/builder-navigation-guard-context";
import { cn } from "@/lib/utils";

type NavItemProps = {
  href: string;
  label: string;
  icon: LucideIcon;
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
        "flex items-center border-2 rounded-xl py-2.5 text-lg font-medium transition-all",
        isCompact ? "justify-center gap-0 px-2" : "gap-3 px-3",
        isActive
          ? "bg-primary text-primary-foreground border-primary"
          : "text-muted-foreground border-transparent hover:bg-muted hover:text-foreground",
        className,
      )}
      title={isCompact ? label : undefined}
      aria-label={isCompact ? label : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {isCompact ? null : label}
    </Link>
  );
}
