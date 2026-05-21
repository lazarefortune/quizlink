"use client";

import { useState } from "react";
import type { ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Coins,
  FileQuestion,
  Home,
  LayoutDashboard,
  LogIn,
  Menu,
  Settings,
  Shield,
  UserPlus,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { ThemeSegmentedControl } from "@/components/admin/theme-segmented-control";
import { BrandQuizLinkText } from "@/components/BrandQuizLinkText";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type PublicMobileNavSheetLinkProps = {
  href: string;
  icon: ElementType;
  label: string;
  isActive: boolean;
};

function PublicMobileNavSheetLink({
  href,
  icon: Icon,
  label,
  isActive,
}: PublicMobileNavSheetLinkProps) {
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

export function PublicMobileNavSheet() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { locale } = useLocale();

  const closeSheet = () => setOpen(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return Boolean(pathname?.startsWith(href));
  };

  const handleSignOut = async () => {
    closeSheet();
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  const primaryNav: Array<{
    href: string;
    icon: ElementType;
    label: string;
    isActive: boolean;
  }> = [];

  if (session?.user) {
    primaryNav.push({
      href: "/dashboard",
      label: t(locale, "nav.dashboard"),
      icon: LayoutDashboard,
      isActive: isActive("/dashboard"),
    });
  } else {
    primaryNav.push({
      href: "/",
      label: t(locale, "nav.home"),
      icon: Home,
      isActive: isActive("/"),
    });
  }

  primaryNav.push({
    href: "/quizzes",
    label: t(locale, "nav.publicQuizzes"),
    icon: FileQuestion,
    isActive: isActive("/quizzes"),
  });

  const accountLabel = locale === "fr" ? "Compte" : "Account";
  const navigationLabel = locale === "fr" ? "Navigation" : "Navigation";
  const authLabel = locale === "fr" ? "Connexion" : "Sign in";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 md:hidden"
          aria-label={locale === "fr" ? "Ouvrir le menu" : "Open menu"}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        closeButtonClassName="right-3 top-[calc(env(safe-area-inset-top,0px)+0.875rem)] opacity-90 sm:right-4 sm:top-[calc(env(safe-area-inset-top,0px)+0.625rem)] [&_svg]:size-6"
        className="flex h-full max-h-dvh w-[min(24rem,94vw)] max-w-none flex-col gap-0 overflow-hidden rounded-l-3xl border-border bg-card p-0 shadow-2xl sm:w-[min(26rem,92vw)] 2xl:w-[min(28rem,90vw)]"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            className="pointer-events-none shrink-0 bg-transparent h-[env(safe-area-inset-top,0px)] sm:h-[env(safe-area-inset-top,0px)]"
            aria-hidden
          />
          <SheetClose asChild>
            <Link
              href="/"
              className="flex h-14 shrink-0 items-center border-b border-border/60 px-4 transition-colors hover:bg-muted/40"
            >
              <span className="font-black text-lg text-foreground">
                <BrandQuizLinkText />
              </span>
            </Link>
          </SheetClose>
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-3 pb-4">
            <div>
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {navigationLabel}
              </p>
              <nav className="flex flex-col gap-1" aria-label="Navigation">
                {primaryNav.map((item) => (
                  <PublicMobileNavSheetLink
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    isActive={item.isActive}
                  />
                ))}
              </nav>
            </div>

            {!session?.user && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {authLabel}
                  </p>
                  <div className="flex flex-col gap-1">
                    <PublicMobileNavSheetLink
                      href="/auth/signin"
                      icon={LogIn}
                      label={t(locale, "auth.signIn.button")}
                      isActive={isActive("/auth/signin")}
                    />
                    <SheetClose asChild>
                      <Link
                        href="/auth/signup"
                        className="flex items-center justify-center gap-3 rounded-xl bg-blue px-3 py-2.5 text-lg font-medium text-blue-foreground shadow-[0_3px_0_hsl(var(--blue)/0.6)] transition-colors hover:bg-blue/90"
                      >
                        <UserPlus className="h-5 w-5 shrink-0" />
                        {t(locale, "nav.getStarted")}
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              </>
            )}

            {session?.user && (
              <>
                <Separator />
                <div>
                  <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    {accountLabel}
                  </p>
                  <div className="flex flex-col gap-1">
                    {session.user.role === "ADMIN" && (
                      <PublicMobileNavSheetLink
                        href="/admin"
                        icon={Shield}
                        label={t(locale, "nav.admin")}
                        isActive={isActive("/admin")}
                      />
                    )}
                    <PublicMobileNavSheetLink
                      href="/account/coins"
                      icon={Coins}
                      label={`${t(locale, "nav.coins")}: ${session.user.coinBalance ?? 0}`}
                      isActive={isActive("/account/coins")}
                    />
                    <PublicMobileNavSheetLink
                      href="/account"
                      icon={Settings}
                      label={t(locale, "userMenu.settings")}
                      isActive={isActive("/account")}
                    />
                  </div>
                </div>
              </>
            )}

            <Separator />
            <div className="flex flex-col gap-1">
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {t(locale, "userMenu.theme")}
              </p>
              <div>
                <ThemeSegmentedControl locale={locale} />
              </div>
            </div>

            {session?.user && (
              <>
                <Separator />
                <div className="flex flex-col gap-1">
                  <Button variant="destructive" onClick={() => void handleSignOut()}>
                    {t(locale, "auth.signOut")}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
