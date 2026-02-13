import { getPublicQuizzes } from "./actions";
import { PublicQuizzesContent } from "./public-quizzes-content";

export const metadata = {
  title: "Quiz publics",
  description: "Découvrez et jouez aux quiz publics créés par la communauté.",
};

export default async function PublicQuizzesPage() {
  const result = await getPublicQuizzes();
  const quizzes = result.success ? result.quizzes : [];

  return <PublicQuizzesContent quizzes={quizzes} />;
}
