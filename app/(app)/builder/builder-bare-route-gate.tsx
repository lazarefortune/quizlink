"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { BUILDER_SESSION_TRANSFER_QUIZ_KEY } from "@/lib/builder/builderClientStorageKeys";
import { shouldAllowBareBuilderEntry } from "@/lib/builder/bareBuilderEntryPolicy";
import {
  buildBuilderDraftKey,
  loadBuilderDraft,
} from "@/lib/builder/builderLocalDraft";

type BuilderBareRouteGateProps = {
  children: React.ReactNode;
};

/**
 * `/builder` without `[quizId]`: redirect signed-in users to `/dashboard/create`
 * unless a local draft restore, session transfer, or `?quizId=` deep-link applies.
 */
export function BuilderBareRouteGate({ children }: BuilderBareRouteGateProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [allowBuilder, setAllowBuilder] = useState(false);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    const userId = session?.user?.id;
    const quizIdParam = searchParams.get("quizId")?.trim() ?? "";
    const hasQuizIdSearchParam = quizIdParam.length > 0;
    const wantsRestoreDraft =
      searchParams.get("restoreDraft") === "1" ||
      searchParams.get("restoreDraft") === "true";

    let hasSessionTransferQuizInStorage = false;
    try {
      const raw = window.sessionStorage.getItem(BUILDER_SESSION_TRANSFER_QUIZ_KEY);
      hasSessionTransferQuizInStorage = Boolean(raw && raw.trim().length > 0);
    } catch {
      hasSessionTransferQuizInStorage = false;
    }

    let hasPersistedNewScopeLocalDraft = false;
    if (userId) {
      const key = buildBuilderDraftKey(userId, "new");
      hasPersistedNewScopeLocalDraft = loadBuilderDraft(key) !== null;
    }

    if (
      shouldAllowBareBuilderEntry({
        hasQuizIdSearchParam,
        wantsRestoreDraft,
        hasSessionTransferQuizInStorage,
        hasPersistedNewScopeLocalDraft,
      })
    ) {
      setAllowBuilder(true);
      return;
    }

    router.replace("/dashboard/create");
  }, [router, searchParams, session?.user?.id, status]);

  if (status === "loading" || !allowBuilder) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return <>{children}</>;
}
