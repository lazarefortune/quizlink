import { redirect } from "next/navigation";

import { resolveLegacyDashboardPreviewRedirect } from "@/lib/quiz/quiz-preview-routes";

type PageProps = {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy dashboard preview URL — redirects to immersive /preview/quiz/{quizId}. */
export default async function LegacyDashboardQuizPreviewPage({
  params,
  searchParams,
}: PageProps) {
  const { quizId } = await params;
  const query = await searchParams;
  redirect(resolveLegacyDashboardPreviewRedirect(quizId, query));
}
