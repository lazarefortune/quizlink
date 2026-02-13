import { QuizPageHeader } from "@/components/quiz-page-header";

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <QuizPageHeader />
      {children}
    </>
  );
}
