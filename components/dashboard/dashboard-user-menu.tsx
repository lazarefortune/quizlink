"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Shield, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { ThemeSegmentedControl } from "@/components/admin/theme-segmented-control";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { getDisplayTitle, getUserInitials } from "@/lib/userProfileDisplay";
import { cn } from "@/lib/utils";
import { useBuilderNavigationGuard } from "@/components/dashboard/builder-navigation-guard-context";

type DashboardUserMenuProps = {
  className?: string;
  /** When true, hides the “Admin” entry (e.g. sidebar is already on admin). */
  hideAdminLink?: boolean;
  /** Desktop collapsed rail: avatar trigger only */
  isCompact?: boolean;
};

export function DashboardUserMenu({
  className,
  hideAdminLink = false,
  isCompact = false,
}: DashboardUserMenuProps) {
  const { data: session } = useSession();
  const { locale } = useLocale();
  const router = useRouter();
  const { interceptLinkClick, requestAction } = useBuilderNavigationGuard();

  const username = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";
  const initials = getUserInitials(username, email);
  const title = getDisplayTitle(username, email);

  const handleSignOut = () => {
    requestAction(async () => {
      await signOut({ redirect: false });
      router.push("/");
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "flex h-auto min-h-0 items-center rounded-2xl border border-border/80 bg-muted/25 py-2.5 text-left shadow-none ring-offset-background transition-colors hover:bg-muted/45 focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:bg-muted/50 data-[state=open]:[&_svg:last-child]:-rotate-180",
            isCompact ? "w-full justify-center px-2" : "w-full gap-3 px-3",
            className,
          )}
          aria-label={isCompact ? title : undefined}
        >
          <Avatar className="h-11 w-11 shrink-0 border border-primary/25 bg-primary/10">
            <AvatarFallback className="bg-primary/15 text-sm font-black uppercase tracking-wide text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          {isCompact ? null : (
            <>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="truncate text-sm font-black leading-tight text-foreground">
                  {title}
                </p>
                <p className="mt-0.5 truncate lowercase text-xs leading-snug font-normal text-muted-foreground">
                  {email || "—"}
                </p>
              </div>
              <ChevronDown
                aria-hidden
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
              />
            </>
          )}
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
          <p className="mb-2 text-base font-medium text-muted-foreground">
            {locale === "fr" ? "Thème" : "Theme"}
          </p>
          <ThemeSegmentedControl locale={locale} />
        </div>
        <DropdownMenuSeparator />
        {session?.user?.role === "ADMIN" && !hideAdminLink && (
          <DropdownMenuItem asChild>
            <Link
              href="/admin"
              onClick={(event) => interceptLinkClick(event, "/admin")}
              className="flex cursor-pointer items-center gap-2"
            >
              <Shield className="h-5 w-5" />
              <span className="font-fredoka text-base font-medium">
                {t(locale, "userMenu.admin")}
              </span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link
            href="/account"
            onClick={(event) => interceptLinkClick(event, "/account")}
            className="flex cursor-pointer items-center gap-2"
          >
            <User className="h-5 w-5" />
            <span className="font-fredoka text-base font-medium">
              {t(locale, "userMenu.account")}
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-fredoka text-base font-medium">
            {t(locale, "auth.signOut")}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
