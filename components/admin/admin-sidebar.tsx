"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Coins,
  Package,
  MessageSquare,
  Shield,
  BarChart3,
  ArrowLeft,
  X,
  User,
  LogOut,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSegmentedControl } from "@/components/admin/theme-segmented-control";

const navItems = [
  { href: "/admin", label: "admin.nav.dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "admin.nav.users", icon: Users },
  { href: "/admin/coins", label: "admin.nav.coins", icon: Coins },
  { href: "/admin/packs", label: "admin.nav.packs", icon: Package },
  { href: "/admin/feedback", label: "admin.nav.feedback", icon: MessageSquare },
  { href: "/admin/analytics", label: "admin.nav.analytics", icon: BarChart3 },
];

type AdminSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
  onNavClick?: () => void;
};

export function AdminSidebar({
  isOpen = true,
  onClose,
  onNavClick,
}: AdminSidebarProps) {
  const [pathname, setPathname] = useState<string>("");
  const { locale } = useLocale();
  const { data: session } = useSession();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPathname(window.location.pathname);

    const handlePopState = () => {
      setPathname(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = "/";
  };

  const handleNavClick = () => {
    onNavClick?.();
    onClose?.();
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={handleNavClick}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-64 min-h-0 shrink-0 flex-col overflow-hidden bg-card transition-transform duration-300 ease-in-out lg:static lg:z-auto lg:h-full lg:max-h-none lg:translate-x-0 lg:self-stretch",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border/60 px-4 pt-[env(safe-area-inset-top,0px)] lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNavClick}
            aria-label="Fermer le menu admin"
            className="h-9 w-9"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Header */}
        <div className="hidden h-14 shrink-0 items-center gap-2 border-b border-border/60 px-8 lg:px-4 lg:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <Link
            href="/admin"
            onClick={() => {
              setPathname("/admin");
              handleNavClick();
            }}
            className="font-bold text-lg text-foreground"
          >
            Admin
          </Link>
        </div>

        {/* Navigation */}
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-3 scrollbar-hide">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  setPathname(item.href);
                  handleNavClick();
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md px-4 py-2.5 text-base font-bold transition-colors",
                  active
                    ? "bg-primary text-white shadow-xs"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:text-white",
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{t(locale, item.label)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bas de barre : retour app + compte (desktop) */}
        <div className="flex shrink-0 flex-col border-t border-border/60">
          <div className="p-3">
            <Link
              href="/dashboard"
              onClick={() => {
                setPathname("/dashboard");
                handleNavClick();
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-5 w-5 shrink-0" />
              <span>{t(locale, "admin.nav.backToDashboard")}</span>
            </Link>
          </div>

          <div className="hidden border-t border-border/60 p-3 lg:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-full justify-start gap-2 border border-border px-3">
                  <User className="h-5 w-5 shrink-0" />
                  <span className="truncate text-base font-bold">{session?.user?.name ?? "Admin"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="w-60 rounded-2xl p-2">
                <div
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1"
                  onPointerDown={(event) => event.stopPropagation()}
                >
                  <span className="text-sm font-bold text-foreground">
                    {locale === "fr" ? "Theme" : "Theme"}
                  </span>
                  <ThemeSegmentedControl locale={locale} />
                </div>
                <DropdownMenuSeparator className="my-1.5" />
                <DropdownMenuItem asChild className="text-base">
                  <Link href="/account" className="flex cursor-pointer items-center gap-2 text-base font-bold">
                    <UserRound className="h-4 w-4" />
                    {locale === "fr" ? "Mon profil" : "My profile"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex cursor-pointer items-center gap-2 text-base font-bold text-red-500"
                >
                  <LogOut className="h-4 w-4" />
                  {t(locale, "auth.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>
    </>
  );
}
