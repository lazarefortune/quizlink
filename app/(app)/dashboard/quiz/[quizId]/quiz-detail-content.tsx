"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { QuizContentQuestion } from "./actions";
import { QuizDetailHeader } from "@/components/dashboard/quiz-detail/quiz-detail-header";
import { QuizQuestionsTab } from "@/components/dashboard/quiz-detail/quiz-questions-tab";
import { MessageCircleQuestionMark, Users } from "lucide-react";
import { QuizResultsTab } from "@/components/dashboard/quiz-detail/quiz-results-tab";
import { QuizShareLinkDialog } from "@/components/dashboard/quiz-detail/quiz-share-link-dialog";
import { BuilderBackToTopButton } from "@/components/quiz-builder/builder-back-to-top-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { QuestionInsight } from "@/lib/dashboard/aggregate-question-insights";
import { parseQuizDetailTab, type QuizDetailTab } from "@/lib/dashboard/parse-quiz-detail-tab";
import type { QuizDetailStatsInput } from "@/lib/dashboard/quiz-detail-stats";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/i18n/use-locale";
import type { QuizLifecycleStatus } from "@/types/quiz-lifecycle";

type QuizDetailContentProps = {
  quizId: string;
  quizName: string;
  quizStatus: QuizLifecycleStatus;
  questions: QuizContentQuestion[];
  stats: QuizDetailStatsInput;
  questionInsights: QuestionInsight[];
};

export function QuizDetailContent({
  quizId,
  quizName,
  quizStatus,
  questions,
  stats,
  questionInsights,
}: QuizDetailContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  const activeTab = parseQuizDetailTab(searchParams.get("tab"));

  const setActiveTab = useCallback(
    (tab: QuizDetailTab) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`/dashboard/quiz/${quizId}?${params.toString()}`, { scroll: false });
    },
    [quizId, router, searchParams],
  );

  return (
    <div className="relative min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <QuizDetailHeader
          quizId={quizId}
          quizName={quizName}
          quizStatus={quizStatus}
        />

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(parseQuizDetailTab(value))}
          className="space-y-6 pb-20"
        >
          <TabsList className="grid h-11 w-full max-w-md grid-cols-2">
            <TabsTrigger
              value="questions"
              className="inline-flex items-center gap-1.5"
            >
              {" "}
              <MessageCircleQuestionMark className="h-4 w-4" />{" "}
              {t(locale, "dashboard.quizTabQuestions")}{" "}
              ({questions.length})
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="inline-flex items-center gap-1.5"
            >
              {" "}
              <Users className="h-4 w-4" />{" "}
              {t(locale, "dashboard.quizTabResults")} ({stats.totalResponses})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="mt-0">
            <QuizQuestionsTab questions={questions} />
          </TabsContent>

          <TabsContent value="results" className="mt-0">
            <QuizResultsTab
              quizStatus={quizStatus}
              stats={stats}
              questions={questions}
              questionInsights={questionInsights}
              onShare={() => setShowShareDialog(true)}
            />
          </TabsContent>
        </Tabs>
      </div>

      <QuizShareLinkDialog
        quizId={quizId}
        quizStatus={quizStatus}
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
      />

      <BuilderBackToTopButton
        scrollContainerRef={scrollContainerRef}
        layoutKey={`${activeTab}-${questions.length}`}
        label={t(locale, "builder.backToTop")}
      />
    </div>
  );
}
