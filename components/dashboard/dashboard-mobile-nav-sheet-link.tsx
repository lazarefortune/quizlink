"use client";

import type { ElementType } from "react";
import Link from "next/link";

import { SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

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
  return (
    <SheetClose asChild>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-lg font-medium transition-all",
          isActive
            ? "bg-primary text-primary-foreground shadow-[0_3px_0_hsl(var(--primary)/0.6)]"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {label}
      </Link>
    </SheetClose>
  );
}
