"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { Sparkles, PenLine } from "lucide-react";

import { getDashboardStats } from "@/app/(app)/dashboard/actions";
import { BuilderLocalDraftCard } from "@/components/builder/BuilderLocalDraftCard";
import { CreateManualServerDraftButton } from "@/components/dashboard/create-manual-server-draft-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";

export default function DashboardCreatePage() {
  const { locale } = useLocale();
  const { data: session } = useSession();
  const [serverDraftQuizIds, setServerDraftQuizIds] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.user?.id) {
      return;
    }
    getDashboardStats()
      .then((result) => {
        if (result.success) {
          setServerDraftQuizIds(result.stats.serverDraftQuizIds);
        }
      })
      .catch(console.error);
  }, [session?.user?.id]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t(locale, "dashboard.create.title")}
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            {t(locale, "dashboard.create.subtitle")}
          </p>
        </header>

        {session?.user?.id ? (
          <BuilderLocalDraftCard
            userId={session.user.id}
            serverDraftQuizIds={serverDraftQuizIds}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-2 border-border bg-card shadow-sm">
            <CardContent className="space-y-4 p-5">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue/10 text-blue">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {t(locale, "dashboard.create.createWithAiTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t(locale, "dashboard.create.createWithAiSubtitle")}
                </p>
              </div>
              <Button variant="blue" asChild className="w-full">
                <Link href="/generate">{t(locale, "dashboard.create.continue")}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="space-y-4 p-5">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PenLine className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  {t(locale, "dashboard.create.createManuallyTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {t(locale, "dashboard.create.createManuallySubtitle")}
                </p>
              </div>
              <CreateManualServerDraftButton
                variant="outline"
                className="w-full"
              >
                {t(locale, "dashboard.create.continue")}
              </CreateManualServerDraftButton>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
