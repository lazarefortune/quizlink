"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Coins, User, LogOut, Shield, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

type TopbarProps = {
  title?: string;
  className?: string;
};

export function Topbar({ title: _title, className }: TopbarProps) {
  const { data: session } = useSession();
  const { locale } = useLocale();
  const router = useRouter();

  const username = session?.user?.name ?? "";
  const email = session?.user?.email ?? "";
  const initials = username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/");
    router.refresh();
  };

  return (
    <header
      className={cn(
        "flex h-12 sm:h-14 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-background px-3 sm:px-4",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <div className="relative h-8 w-8 shrink-0">
            <Image
              src="/mascot.jpg"
              alt="QuizLink"
              fill
              className="object-contain"
              sizes="32px"
            />
          </div>
          <span className="font-black text-lg text-foreground">
            Quiz<span className="text-primary">Link</span>
          </span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {session?.user && (
          <Link
            href="/account/coins"
            className="flex items-center gap-1.5 rounded-xl border-2 border-border bg-muted/40 px-2.5 py-1.5 font-bold text-foreground hover:bg-muted/60 transition-colors"
          >
            <Coins className="h-5 w-5 text-blue shrink-0" />
            <span className="tabular-nums text-sm text-blue font-black">
              {session.user.coinBalance ?? 0}
            </span>
          </Link>
        )}
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-2 px-2 sm:px-3 max-w-[180px]"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                  {initials || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block truncate text-base font-bold capitalize">
                {username}
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {/* User info header */}
            <div className="flex items-center gap-3 px-3 py-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-base">
                  {initials || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-nunito text-base font-black truncate capitalize">
                  {username}
                </p>
                <p className="font-nunito text-sm text-muted-foreground truncate">
                  {email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            {session?.user?.role === "ADMIN" && (
              <DropdownMenuItem asChild>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Shield className="h-5 w-5" />
                  <span className="text-base font-nunito font-bold">
                    {t(locale, "userMenu.admin")}
                  </span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem asChild>
              <Link
                href="/account"
                className="flex items-center gap-2 cursor-pointer"
              >
                <User className="h-5 w-5" />
                <span className="text-base font-nunito font-bold">
                  {t(locale, "userMenu.account")}
                </span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="h-5 w-5" />
              <span className="text-base font-nunito font-bold">
                {t(locale, "auth.signOut")}
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
