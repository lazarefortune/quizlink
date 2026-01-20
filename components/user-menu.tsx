"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, LogOut, Settings, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import Link from "next/link";

export function UserMenu() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Listen for session update events
  useEffect(() => {
    const handleSessionUpdate = async () => {
      // Update session to get latest data from server
      if (updateSession) {
        try {
          await updateSession();
        } catch (error) {
          console.error("Error updating session in UserMenu:", error);
        }
      }
      // Force router refresh to get new session data
      router.refresh();
    };

    window.addEventListener("session:update", handleSessionUpdate);
    return () => {
      window.removeEventListener("session:update", handleSessionUpdate);
    };
  }, [router, updateSession]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

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
            {t(locale, "auth.signUp.button")}
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
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:inline">{session.user.name || session.user.email}</span>
      </Button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 rounded-md border bg-popover shadow-lg z-50" onClick={(e) => e.stopPropagation()}>
            <div className="p-2">
              <div className="px-3 py-2 text-sm font-medium border-b">
                {session.user.name || session.user.email}
              </div>
              <div className="py-1">
                <Link
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors text-left"
                >
                  <Settings className="h-4 w-4" />
                  {t(locale, "userMenu.settings")}
                </Link>
                {session.user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors text-left"
                  >
                    <Shield className="h-4 w-4" />
                    {t(locale, "userMenu.admin")}
                  </Link>
                )}
              </div>
              <div className="border-t pt-1 mt-1">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  {t(locale, "auth.signOut")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
