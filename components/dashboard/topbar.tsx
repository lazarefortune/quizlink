"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Menu, Coins } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { User, Settings, LogOut, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type TopbarProps = {
  title?: string;
  onMenuClick?: () => void;
  className?: string;
};

export function Topbar({ title, onMenuClick, className }: TopbarProps) {
  const { data: session } = useSession();
  const { locale } = useLocale();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  return (
    <header
      className={cn(
        "flex h-12 sm:h-14 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background px-3 sm:px-4",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        {session?.user && (
          <Link
            href="/account/coins"
            className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors"
          >
            <Coins className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
            <span className="tabular-nums">{session.user.coinBalance ?? 0}</span>
          </Link>
        )}
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 sm:h-9 sm:px-3 sm:gap-2 max-w-[140px] sm:max-w-[180px]"
            >
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate text-sm">
                {session?.user?.name ?? session?.user?.email ?? ""}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm font-medium border-b">
              {session?.user?.email}
            </div>
            <DropdownMenuItem asChild>
              <Link href="/account" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                {t(locale, "userMenu.settings")}
              </Link>
            </DropdownMenuItem>
            {session?.user?.role === "ADMIN" && (
              <DropdownMenuItem asChild>
                <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                  <Shield className="h-4 w-4" />
                  {t(locale, "userMenu.admin")}
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {t(locale, "auth.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
