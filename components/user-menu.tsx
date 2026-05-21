"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cookie, User, LogOut, Settings, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCookieConsent } from "@/components/cookie-consent/cookie-consent-context";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";

export function UserMenu() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const { locale } = useLocale();
  const { openConsentPanel } = useCookieConsent();

  useEffect(() => {
    const handleSessionUpdate = async () => {
      if (updateSession) {
        try {
          await updateSession();
        } catch (error) {
          console.error("Error updating session in UserMenu:", error);
        }
      }
      router.refresh();
    };

    window.addEventListener("session:update", handleSessionUpdate);
    return () => {
      window.removeEventListener("session:update", handleSessionUpdate);
    };
  }, [router, updateSession]);

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/auth/signin">
          <Button variant="ghost" size="sm">
            {t(locale, "auth.signIn.button")}
          </Button>
        </Link>
        <Link href="/auth/signup">
          <Button variant="primary" size="sm">
            {t(locale, "nav.getStarted")}
          </Button>
        </Link>
      </div>
    );
  }

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
          className="flex h-auto min-h-0 items-center gap-2 px-2 py-1.5"
        >
          <User className="h-6 w-6 shrink-0" />
          <span className="hidden max-w-[140px] truncate sm:inline">
            {session.user.name || session.user.email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="bottom" className="w-64 rounded-2xl p-2">
        <DropdownMenuItem asChild>
          <Link href="/account" className="flex cursor-pointer items-center gap-2">
            <Settings className="h-5 w-5" />
            <span className="font-fredoka text-base font-medium">
              {t(locale, "userMenu.settings")}
            </span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => openConsentPanel()}
          className="flex cursor-pointer items-center gap-2"
        >
          <Cookie className="h-5 w-5" />
          <span className="font-fredoka text-base font-medium">
            {t(locale, "cookieConsent.footerLink")}
          </span>
        </DropdownMenuItem>
        {session.user.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex cursor-pointer items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="font-fredoka text-base font-medium">
                {t(locale, "userMenu.admin")}
              </span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void handleSignOut()}
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
