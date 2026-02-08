"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { FileText, Users, Plus, Sparkles, ArrowRight } from "lucide-react";

import { useLocale } from "@/lib/i18n/use-locale";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DashboardWelcomePage() {
  const { data: session } = useSession();
  const { locale } = useLocale();

  const name =
    session?.user?.name?.split(" ")[0] ||
    session?.user?.email ||
    (locale === "fr" ? "tu" : "you");

  return (
    <div className="p-4 sm:p-5 md:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Welcome block */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {t(locale, "dashboard.welcome.title", { name })}
          </h1>
          <p className="mt-2 text-muted-foreground sm:text-lg">
            {t(locale, "dashboard.welcome.subtitle")}
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <Link href="/dashboard/quizzes">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col p-5 sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-semibold">
                  {t(locale, "dashboard.welcome.myQuizzes")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(locale, "dashboard.welcome.myQuizzesDesc")}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  <span>{locale === "fr" ? "Voir mes quiz" : "View my quizzes"}</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/participants">
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col p-5 sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-semibold">
                  {t(locale, "dashboard.welcome.participants")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(locale, "dashboard.welcome.participantsDesc")}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  <span>{locale === "fr" ? "Gérer" : "Manage"}</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Create quiz CTA */}
        <div className="mt-8 sm:mt-10">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="font-semibold">
                  {t(locale, "dashboard.welcome.createQuiz")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t(locale, "dashboard.welcome.createQuizDesc")}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="primary" size="sm" className="gap-2 shrink-0">
                    <Plus className="h-4 w-4" />
                    {t(locale, "nav.create")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/builder" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t(locale, "nav.createManually")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/generate" className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      {t(locale, "nav.createWithAI")}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
