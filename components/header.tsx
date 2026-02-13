"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Sparkles, Plus, LayoutDashboard, LogIn, UserPlus, Settings, LogOut, FileText, FileQuestion, Coins, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLocale();
  const { data: session, update: updateSession } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Listen for session update events
  useEffect(() => {
    const handleSessionUpdate = async () => {
      // Update session to get latest data from server
      // Pass empty object to trigger JWT callback refresh
      if (updateSession) {
        try {
          console.log("[Header] Session update event received, refreshing session...");
          await updateSession({});
          // Small delay to ensure session propagates
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error("Error updating session in Header:", error);
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

  const handleOpenSidebar = () => {
    setMobileMenuOpen(true);
    // Trigger animation after a tiny delay to ensure the element is rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    });
  };

  const handleCloseSidebar = () => {
    setIsAnimating(false);
    setIsClosing(true);
    setTimeout(() => {
      setMobileMenuOpen(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  const navItems: Array<{ href: string; label: string; icon: typeof Home }> = [];

  if (session?.user) {
    navItems.push({ href: "/dashboard", label: t(locale, "nav.dashboard"), icon: LayoutDashboard });
    if (session.user.role === "ADMIN") {
      navItems.push({ href: "/admin", label: t(locale, "nav.admin"), icon: Shield });
    }
  } else {
    navItems.push({ href: "/", label: t(locale, "nav.home"), icon: Home });
  }
  navItems.push({ href: "/quizzes", label: t(locale, "nav.publicQuizzes"), icon: FileQuestion });

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  if (
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/auth") ||
    pathname?.startsWith("/account") ||
    pathname?.startsWith("/generate") ||
    pathname?.startsWith("/builder") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/p/") ||
    pathname?.startsWith("/quiz/")
  ) {
    return null;
  }

  return (
    <header className="sticky top-0 z-[100] w-full shadow-md border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
              aria-label={locale === "fr" ? "Retour à l'accueil" : "Back to home"}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <span className="font-heading text-lg font-bold text-primary-foreground">Q</span>
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                Quiz<span className="text-primary">Link</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-base font-medium transition-colors hover:text-primary",
                  isActive(item.href)
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
            {/* Create button with dropdown for all users */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t(locale, "nav.create")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem asChild>
                  <Link href={session?.user ? "/builder" : "/builder/preview"} className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4" />
                    {t(locale, "nav.createManually")}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={session?.user ? "/generate" : "/generate/preview"} className="flex items-center gap-2 text-base">
                    <Sparkles className="h-4 w-4" />
                    {t(locale, "nav.createWithAI")}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

              {/* Right side controls */}
              <div className="flex items-center gap-3">
                {session?.user && (
                  <Link href="/account/coins" className="hidden md:flex items-center gap-1.5 px-3 py-2.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20">
                    <Coins className="h-6 w-6" />
                    <span className="text-base font-medium">{session.user.coinBalance || 0}</span>
                  </Link>
                )}
                {/* Group: theme + auth/profile — réduit l’impression d’espacement entre ghost buttons */}
                <div className="flex items-center rounded-lg border border-border/60 bg-muted/40 dark:bg-muted/20 py-0.5 px-1 md:pl-0.5 md:pr-1 gap-0.5">
                  <ThemeToggle />
                  <div className="hidden md:block w-px self-stretch min-h-6 bg-border/60 shrink-0" aria-hidden />
                  <div className="hidden md:block">
                    <UserMenu />
                  </div>
                </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => {
                if (mobileMenuOpen) {
                  handleCloseSidebar();
                } else {
                  handleOpenSidebar();
                }
              }}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar - Rendered via Portal */}
      {typeof window !== "undefined" && (mobileMenuOpen || isClosing) && createPortal(
        <>
          {/* Overlay */}
          <div
            className={cn(
              "fixed inset-0 bg-black/50 z-[110] md:hidden transition-opacity duration-300",
              mobileMenuOpen && !isClosing ? "opacity-100" : "opacity-0"
            )}
            onClick={handleCloseSidebar}
          />
          {/* Sidebar */}
          <div
            className={cn(
              "fixed top-0 left-0 h-full w-64 bg-background border-r shadow-xl z-[120] md:hidden transition-transform duration-300 ease-out",
              isAnimating && !isClosing ? "translate-x-0" : "-translate-x-full"
            )}
          >
            <div className="flex flex-col h-full">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <Link
                  href="/"
                  onClick={handleCloseSidebar}
                  className="inline-flex items-center gap-2 rounded-lg transition-opacity hover:opacity-80"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                    <span className="font-heading text-lg font-bold text-primary-foreground">Q</span>
                  </div>
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    Quiz<span className="text-primary">Link</span>
                  </span>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseSidebar}
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Sidebar Navigation */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="flex flex-col space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleCloseSidebar}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 text-base font-medium transition-colors rounded-md",
                          isActive(item.href)
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}

                  {/* Create options for mobile - show for all users */}
                  <>
                    <Link
                      href={session?.user ? "/builder" : "/builder/preview"}
                      onClick={handleCloseSidebar}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-base font-medium transition-colors rounded-md",
                        isActive("/builder")
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <FileText className="h-5 w-5" />
                      {t(locale, "nav.createManually")}
                    </Link>
                    <Link
                      href={session?.user ? "/generate" : "/generate/preview"}
                      onClick={handleCloseSidebar}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-base font-medium transition-colors rounded-md",
                        isActive("/generate")
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Sparkles className="h-5 w-5" />
                      {t(locale, "nav.createWithAI")}
                    </Link>
                  </>
                </div>

                {/* Auth buttons for mobile - only show if not authenticated */}
                {!session?.user && (
                  <div className="border-t pt-4 mt-4 space-y-2">
                    <Link
                      href="/auth/signin"
                      onClick={handleCloseSidebar}
                      className="flex items-center gap-3 px-3 py-2 text-base font-medium transition-colors rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <LogIn className="h-5 w-5" />
                      {t(locale, "auth.signIn.button")}
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={handleCloseSidebar}
                      className="flex items-center gap-3 px-3 py-2 text-base font-medium transition-colors rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <UserPlus className="h-5 w-5" />
                      {t(locale, "nav.getStarted")}
                    </Link>
                  </div>
                )}

                  {/* User menu for mobile - only show if authenticated */}
                  {session?.user && (
                    <div className="border-t pt-4 mt-4">
                      <div className="px-3 py-2 text-sm font-medium border-b mb-2">
                        {session.user.name || session.user.email}
                      </div>
                      <Link
                        href="/account/coins"
                        onClick={handleCloseSidebar}
                        className="flex items-center gap-3 w-full px-3 py-2 text-base font-medium transition-colors rounded-md text-left hover:bg-accent hover:text-accent-foreground"
                      >
                        <Coins className="h-5 w-5" />
                        {t(locale, "nav.coins")}: {session.user.coinBalance || 0}
                      </Link>
                    <Link
                      href="/account"
                      onClick={handleCloseSidebar}
                      className="flex items-center gap-3 w-full px-3 py-2 text-base font-medium transition-colors rounded-md text-left text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    >
                      <Settings className="h-5 w-5" />
                      {t(locale, "userMenu.settings")}
                    </Link>
                    <button
                      onClick={async () => {
                        await signOut({ redirect: false });
                        handleCloseSidebar();
                        router.push("/");
                        router.refresh();
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2 text-base font-medium transition-colors rounded-md text-left hover:bg-accent hover:text-accent-foreground mt-1"
                    >
                      <LogOut className="h-5 w-5" />
                      {t(locale, "auth.signOut")}
                    </button>
                  </div>
                )}

              </nav>
            </div>
          </div>
        </>,
        document.body
      )}
    </header>
  );
}
