"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Quiz } from "@/types/quiz";

export default function QuizPreviewPage() {
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const quizData = sessionStorage.getItem("currentQuiz");
    if (!quizData) {
      router.push("/generate");
      return;
    }

    try {
      const parsedQuiz: Quiz = JSON.parse(quizData);
      parsedQuiz.createdAt = new Date(parsedQuiz.createdAt);
      setQuiz(parsedQuiz);
    } catch {
      router.push("/generate");
      return;
    }

    setIsHydrated(true);
  }, [router]);

  if (!quiz || !isHydrated) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    );
  }

  const handleStartQuiz = async () => {
    // The quiz will be started when the play page loads
    router.push("/quiz/play");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold">Quiz Preview</h1>
          <p className="text-muted-foreground">
            Review your quiz before starting
          </p>
        </header>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>
                  Source: {quiz.sourceType} • Created:{" "}
                  {new Date(quiz.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant="outline">{quiz.questions.length} questions</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">Question Types</h3>
              <div className="flex flex-wrap gap-2">
                {quiz.questions.some((q) => q.type === "MCQ") && (
                  <Badge>Multiple Choice</Badge>
                )}
                {quiz.questions.some((q) => q.type === "TRUE_FALSE") && (
                  <Badge>True/False</Badge>
                )}
                {quiz.questions.some((q) => q.type === "CHECKBOX") && (
                  <Badge>Checkbox</Badge>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/generate")}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleStartQuiz}
              className="flex-1"
            >
              Start Quiz
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
