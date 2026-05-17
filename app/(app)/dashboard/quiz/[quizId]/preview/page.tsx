import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ quizId: string }>;
};

/** Legacy preview route — redirects to the unified quiz page (Questions tab). */
export default async function QuizPreviewPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { quizId } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { ownerId: true },
  });

  if (!quiz || quiz.ownerId !== session.user.id) {
    redirect("/dashboard/quizzes");
  }

  redirect(`/dashboard/quiz/${quizId}?tab=questions`);
}
