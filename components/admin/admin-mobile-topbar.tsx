"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, Shield, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminSidebar } from "./admin-sidebar";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

export function AdminMobileTopbar() {
  const { data: session } = useSession();
  const { locale } = useLocale();
  const router = useRouter();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  return (
    <header className="flex h-12 sm:h-14 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background px-3 sm:px-4 lg:hidden">
      <div className="flex items-center gap-2">
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 2xl:w-80">
            <SheetTitle className="sr-only">Admin navigation</SheetTitle>
            <AdminSidebar onNavClick={() => setIsSheetOpen(false)} />
          </SheetContent>
        </Sheet>

        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Shield className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">Admin</span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2">
              <User className="h-5 w-5 shrink-0" />
              <span className="truncate text-sm capitalize max-w-[100px]">
                {session?.user?.name ?? ""}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                {t(locale, "admin.nav.backToDashboard")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2 cursor-pointer text-red-500"
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
