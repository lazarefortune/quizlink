import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminFeedbackContent } from "./admin-feedback-content";

export default async function AdminFeedbackPage() {
  const session = await auth();

  // Only admins can access this page
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all feedbacks
  const feedbacks = await prisma.feedback.findMany({
    include: {
      user: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100, // Limit to first 100 feedbacks
  });

  const formattedFeedbacks = feedbacks.map((f) => ({
    id: f.id,
    userId: f.userId,
    user: f.user
      ? {
          email: f.user.email,
          name: f.user.name,
        }
      : null,
    type: f.type,
    message: f.message,
    page: f.page,
    userAgent: f.userAgent,
    status: f.status,
    createdAt: f.createdAt,
  }));

  return <AdminFeedbackContent initialFeedbacks={formattedFeedbacks} />;
}
