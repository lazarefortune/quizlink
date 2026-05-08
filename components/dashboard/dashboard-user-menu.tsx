"use client";

import Link from "next/link";
import { User, LogOut, Shield } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { ThemeSegmentedControl } from "@/components/admin/theme-segmented-control";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type DashboardUserMenuProps = {
  className?: string;
};

export function DashboardUserMenu({ className }: DashboardUserMenuProps) {
  const { data: session } = useSession();
  const { locale } = useLocale();
  const router = useRouter();

  const username = session?.user?.name ?? "";

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-10 w-full justify-start gap-2 border border-border px-3",
            className,
          )}
        >
          <User className="h-5 w-5 shrink-0" />
          <span className="truncate text-base font-bold">
            {username || "…"}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="top"
        className="w-64 rounded-2xl p-2"
      >
        <div
          className="px-2 py-2"
          onPointerDown={(event) => event.stopPropagation()}
        >
          <p className="mb-2 text-sm font-bold text-muted-foreground">
            {locale === "fr" ? "Thème" : "Theme"}
          </p>
          <ThemeSegmentedControl locale={locale} />
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/account"
            className="flex cursor-pointer items-center gap-2"
          >
            <User className="h-5 w-5" />
            <span className="font-nunito text-base font-bold">
              {t(locale, "userMenu.account")}
            </span>
          </Link>
        </DropdownMenuItem>
        {session?.user?.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link
              href="/admin"
              className="flex cursor-pointer items-center gap-2"
            >
              <Shield className="h-5 w-5" />
              <span className="font-nunito text-base font-bold">
                {t(locale, "userMenu.admin")}
              </span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-nunito text-base font-bold">
            {t(locale, "auth.signOut")}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
