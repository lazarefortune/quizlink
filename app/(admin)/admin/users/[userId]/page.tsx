import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAdminUserWithQuizzes } from "../../actions";
import { AdminUserQuizzesContent } from "./admin-user-quizzes-content";

type PageProps = {
  params: Promise<{ userId: string }>;
};

export default async function AdminUserQuizzesPage({ params }: PageProps) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { userId } = await params;
  const result = await getAdminUserWithQuizzes(userId);

  if (!result.success) {
    redirect("/admin");
  }

  return (
    <AdminUserQuizzesContent
      user={result.user}
      quizzes={result.quizzes}
      participants={result.participants}
    />
  );
}
