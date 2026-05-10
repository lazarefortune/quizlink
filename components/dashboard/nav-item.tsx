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
};

export function NavItem({
  href,
  label,
  icon: Icon,
  onClick,
  className,
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
        "flex items-center border-2 gap-3 rounded-xl px-3 py-2.5 text-lg font-medium transition-all",
        isActive
          ? "bg-primary text-primary-foreground border-primary"
          : "text-muted-foreground border-transparent hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </Link>
  );
}
