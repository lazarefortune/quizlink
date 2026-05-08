"use client";

import { useState } from "react";
import { Menu, User, Settings, LogOut, UserRound } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
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
import { ThemeSegmentedControl } from "@/components/admin/theme-segmented-control";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const { locale } = useLocale();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-card">
      <div className="flex min-h-0 flex-1">
        <AdminSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background lg:rounded-l-3xl lg:border lg:border-border dark:lg:border-border">
            <header
              className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3 pt-[env(safe-area-inset-top,0px)] lg:hidden"
              role="banner"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(true)}
                className="shrink-0"
                aria-label="Ouvrir le menu admin"
              >
                <Menu className="size-5" />
              </Button>

              <div className="flex shrink-0 items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
                      <User className="h-5 w-5 shrink-0" />
                      <span className="truncate text-sm capitalize max-w-[100px]">
                        {session?.user?.name ?? ""}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2">
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
                      <Link href="/account" className="flex items-center font-bold text-base gap-2 cursor-pointer">
                        <UserRound className="h-4 w-4" />
                        {locale === "fr" ? "Mon profil" : "My profile"}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="flex items-center font-bold text-base gap-2 cursor-pointer text-red-500"
                    >
                      <LogOut className="h-4 w-4" />
                      {t(locale, "auth.signOut")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            <main className="min-h-0 flex-1">
              <div className="mx-auto max-w-8xl px-4 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:px-6 md:pt-8 md:pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
