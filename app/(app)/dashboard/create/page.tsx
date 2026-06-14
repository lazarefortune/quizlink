"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";

import { getDashboardStats } from "@/app/(app)/dashboard/actions";
import { BuilderLocalDraftCard } from "@/components/builder/BuilderLocalDraftCard";
import { CreateManualServerDraftButton } from "@/components/dashboard/create-manual-server-draft-button";
import {
  CreateQuizAiIcon,
  CreateQuizManualIcon,
} from "@/components/dashboard/create-quiz-modal-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import { cn } from "@/lib/utils";

type CreateOptionCardProps = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action: ReactNode;
  hoverBorderClassName: string;
};

function CreateOptionCard({
  icon,
  title,
  subtitle,
  action,
  hoverBorderClassName,
}: CreateOptionCardProps) {
  return (
    <Card
      className={cn(
        "border-2 border-border bg-card shadow-sm transition-all hover:shadow-md",
        hoverBorderClassName,
      )}
    >
      <CardContent className="flex h-full flex-col items-center gap-4 p-5 text-center sm:p-6">
        {icon}
        <div className="space-y-2">
          <h2 className="font-fredoka text-lg font-semibold leading-snug text-foreground sm:text-xl">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p>
        </div>
        <div className="mt-auto w-full pt-1">{action}</div>
      </CardContent>
    </Card>
  );
}

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
          <CreateOptionCard
            icon={<CreateQuizAiIcon className="h-14 w-14 sm:h-16 sm:w-16" />}
            title={t(locale, "dashboard.create.createWithAiTitle")}
            subtitle={t(locale, "dashboard.create.createWithAiSubtitle")}
            hoverBorderClassName="hover:border-blue"
            action={
              <Button variant="blue" asChild className="w-full">
                <Link href="/generate">{t(locale, "dashboard.create.continue")}</Link>
              </Button>
            }
          />

          <CreateOptionCard
            icon={<CreateQuizManualIcon className="h-14 w-14 sm:h-16 sm:w-16" />}
            title={t(locale, "dashboard.create.createManuallyTitle")}
            subtitle={t(locale, "dashboard.create.createManuallySubtitle")}
            hoverBorderClassName="hover:border-primary"
            action={
              <CreateManualServerDraftButton variant="primary" className="w-full">
                {t(locale, "dashboard.create.continue")}
              </CreateManualServerDraftButton>
            }
          />
        </div>
      </div>
    </div>
  );
}
