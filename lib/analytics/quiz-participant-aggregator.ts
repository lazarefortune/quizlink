import { prisma } from "@/lib/prisma";

const LABEL_SHORT_MAX = 120;
const MOST_MISSED_CAP = 10;
const EXAMPLES_CAP = 3;

function truncateLabel(text: string, maxLen: number = LABEL_SHORT_MAX): string {
  const stripped = text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (stripped.length <= maxLen) return stripped;
  return stripped.slice(0, maxLen - 3) + "...";
}

export type ParticipantReportPayload = {
  quiz: { id: string; name: string; questionsCount: number; settingsSummary: string };
  participant: { id: string; name: string };
  totals: {
    attemptsCount: number;
    answersCount: number;
    correctCount: number;
    accuracyPct: number;
    avgTimePerQuestionSec: number | null;
    lastAttemptAt: string | null;
    trend: Array<{ attemptIndex: number; accuracyPct: number; avgTimeSec: number | null }>;
  };
  byQuestionType: {
    MULTIPLE_CHOICE: { seen: number; correct: number; accuracyPct: number };
    TRUE_FALSE: { seen: number; correct: number; accuracyPct: number };
    CHECKBOX: {
      seen: number;
      correct: number;
      accuracyPct: number;
      checkboxPatterns: { avgMissedCorrectOptions: number; avgExtraWrongOptions: number };
    };
  };
  mostMissedQuestions: Array<{
    questionId: string;
    labelShort: string;
    type: string;
    timesSeen: number;
    timesWrong: number;
    wrongRatePct: number;
    correctOptionLabelsShort: string[];
    topWrongOptionLabelsShort: Array<{ labelShort: string; pickedCount: number }>;
  }>;
  timePressureSignals: {
    tooFastQuestions: Array<{ questionId: string; labelShort: string; avgTimeSec: number; wrongRatePct: number }>;
    tooSlowQuestions: Array<{ questionId: string; labelShort: string; avgTimeSec: number; wrongRatePct: number }>;
  };
  examples: Array<{
    questionLabelShort: string;
    type: string;
    userPickedLabelsShort: string[];
    correctLabelsShort: string[];
    attemptIndex: number;
  }>;
  constraints: {
    language: "fr";
    maxReportLength: "medium";
    focus: string[];
  };
};

/**
 * Build aggregated payload for AI participant report.
 * Uses only server-side data; no raw correct-answer dumps.
 * Quiz must be owned by caller; participant must have attempts for this quiz via a link.
 */
export async function buildQuizParticipantReportPayload(
  quizId: string,
  participantId: string
): Promise<ParticipantReportPayload | null> {
  if (!prisma) return null;

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: {
      id: true,
      name: true,
      settings: true,
      _count: { select: { questions: true } },
    },
  });
  if (!quiz) return null;

  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { id: true, name: true },
  });
  if (!participant) return null;

  const link = await prisma.quizLink.findFirst({
    where: { quizId, participantId },
    select: { id: true },
  });
  if (!link) return null;

  const attempts = await prisma.quizAttempt.findMany({
    where: { quizLinkId: link.id, participantId },
    orderBy: { startedAt: "asc" },
    include: {
      answers: {
        include: {
          question: {
            select: {
              id: true,
              type: true,
              label: true,
              options: { select: { id: true, label: true, isCorrect: true } },
            },
          },
        },
      },
    },
  });

  if (attempts.length === 0) return null;

  const questionsCount = quiz._count.questions;
  const settingsSummary =
    typeof quiz.settings === "object" && quiz.settings !== null
      ? JSON.stringify(quiz.settings).slice(0, 200)
      : "";

  let answersCount = 0;
  let correctCount = 0;
  let totalTimeSec = 0;
  let timeCount = 0;
  const trend: Array<{ attemptIndex: number; accuracyPct: number; avgTimeSec: number | null }> = [];
  const byType: Record<
    string,
    { seen: number; correct: number; checkboxMissedCorrect?: number[]; checkboxExtraWrong?: number[] }
  > = {
    MULTIPLE_CHOICE: { seen: 0, correct: 0 },
    TRUE_FALSE: { seen: 0, correct: 0 },
    CHECKBOX: { seen: 0, correct: 0, checkboxMissedCorrect: [], checkboxExtraWrong: [] },
  };
  const questionStats = new Map<
    string,
    {
      label: string;
      type: string;
      correctLabels: string[];
      seen: number;
      wrong: number;
      timeSum: number;
      timeCount: number;
      wrongPicks: Map<string, number>;
    }
  >();
  const examples: Array<{
    questionLabelShort: string;
    type: string;
    userPickedLabelsShort: string[];
    correctLabelsShort: string[];
    attemptIndex: number;
  }> = [];

  attempts.forEach((attempt, attemptIndex) => {
    let attemptCorrect = 0;
    let attemptTotal = 0;
    let attemptTimeSum = 0;
    let attemptTimeCount = 0;

    attempt.answers.forEach((answer) => {
      answersCount++;
      attemptTotal++;
      if (answer.isCorrect) {
        correctCount++;
        attemptCorrect++;
      }
      const timeSec = answer.timeSpent ?? 0;
      if (answer.timeSpent != null) {
        totalTimeSec += timeSec;
        timeCount++;
        attemptTimeSum += timeSec;
        attemptTimeCount++;
      }

      const q = answer.question;
      const correctOptions = q.options.filter((o) => o.isCorrect);
      const correctLabels = correctOptions.map((o) => truncateLabel(o.label));
      const selectedIds = Array.isArray(answer.selectedOptionIds) ? (answer.selectedOptionIds as string[]) : [];
      const selectedOptions = q.options.filter((o) => selectedIds.includes(o.id));
      const userPickedLabels = selectedOptions.map((o) => truncateLabel(o.label));

      if (!byType[q.type]) byType[q.type] = { seen: 0, correct: 0 };
      byType[q.type].seen++;
      if (answer.isCorrect) byType[q.type].correct++;

      if (q.type === "CHECKBOX") {
        const correctIds = new Set(correctOptions.map((o) => o.id));
        const selectedSet = new Set(selectedIds);
        let missedCorrect = 0;
        let extraWrong = 0;
        correctOptions.forEach((o) => {
          if (!selectedSet.has(o.id)) missedCorrect++;
        });
        selectedOptions.forEach((o) => {
          if (!correctIds.has(o.id)) extraWrong++;
        });
        const cb = byType.CHECKBOX as { checkboxMissedCorrect?: number[]; checkboxExtraWrong?: number[] };
        if (!cb.checkboxMissedCorrect) cb.checkboxMissedCorrect = [];
        if (!cb.checkboxExtraWrong) cb.checkboxExtraWrong = [];
        cb.checkboxMissedCorrect.push(missedCorrect);
        cb.checkboxExtraWrong.push(extraWrong);
      }

      let stat = questionStats.get(q.id);
      if (!stat) {
        stat = {
          label: q.label,
          type: q.type,
          correctLabels,
          seen: 0,
          wrong: 0,
          timeSum: 0,
          timeCount: 0,
          wrongPicks: new Map<string, number>(),
        };
        questionStats.set(q.id, stat);
      }
      stat.seen++;
      if (!answer.isCorrect) {
        stat.wrong++;
        selectedOptions.forEach((opt) => {
          if (!correctOptions.some((c) => c.id === opt.id)) {
            const lbl = truncateLabel(opt.label);
            stat!.wrongPicks.set(lbl, (stat!.wrongPicks.get(lbl) ?? 0) + 1);
          }
        });
      }
      stat.timeSum += timeSec;
      stat.timeCount++;

      if (!answer.isCorrect && examples.length < EXAMPLES_CAP) {
        examples.push({
          questionLabelShort: truncateLabel(q.label),
          type: q.type,
          userPickedLabelsShort: userPickedLabels,
          correctLabelsShort: correctLabels,
          attemptIndex: attemptIndex + 1,
        });
      }
    });

    const accPct = attemptTotal > 0 ? Math.round((attemptCorrect / attemptTotal) * 100) : 0;
    const avgTime = attemptTimeCount > 0 ? Math.round((attemptTimeSum / attemptTimeCount) * 10) / 10 : null;
    trend.push({ attemptIndex: attemptIndex + 1, accuracyPct: accPct, avgTimeSec: avgTime });
  });

  const accuracyPct = answersCount > 0 ? Math.round((correctCount / answersCount) * 100) : 0;
  const avgTimePerQuestionSec =
    timeCount > 0 ? Math.round((totalTimeSec / timeCount) * 10) / 10 : null;
  const lastAttempt = attempts[attempts.length - 1];
  const lastAttemptAt = lastAttempt?.finishedAt ?? lastAttempt?.startedAt;

  const mostMissed = Array.from(questionStats.entries())
    .map(([questionId, s]) => ({
      questionId,
      labelShort: truncateLabel(s.label),
      type: s.type,
      timesSeen: s.seen,
      timesWrong: s.wrong,
      wrongRatePct: s.seen > 0 ? Math.round((s.wrong / s.seen) * 100) : 0,
      correctOptionLabelsShort: s.correctLabels,
      topWrongOptionLabelsShort: Array.from(s.wrongPicks.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([labelShort, pickedCount]) => ({ labelShort, pickedCount })),
    }))
    .filter((q) => q.timesWrong > 0)
    .sort((a, b) => b.wrongRatePct - a.wrongRatePct)
    .slice(0, MOST_MISSED_CAP);

  const tooFastQuestions: Array<{ questionId: string; labelShort: string; avgTimeSec: number; wrongRatePct: number }> = [];
  const tooSlowQuestions: Array<{ questionId: string; labelShort: string; avgTimeSec: number; wrongRatePct: number }> = [];
  questionStats.forEach((s, questionId) => {
    const avgSec = s.timeCount > 0 ? Math.round((s.timeSum / s.timeCount) * 10) / 10 : 0;
    const wrongRatePct = s.seen > 0 ? Math.round((s.wrong / s.seen) * 100) : 0;
    if (avgSec > 0 && avgSec < 3) tooFastQuestions.push({ questionId, labelShort: truncateLabel(s.label), avgTimeSec: avgSec, wrongRatePct });
    if (avgSec > 30) tooSlowQuestions.push({ questionId, labelShort: truncateLabel(s.label), avgTimeSec: avgSec, wrongRatePct });
  });

  const byQuestionType = {
    MULTIPLE_CHOICE: {
      seen: byType.MULTIPLE_CHOICE?.seen ?? 0,
      correct: byType.MULTIPLE_CHOICE?.correct ?? 0,
      accuracyPct:
        (byType.MULTIPLE_CHOICE?.seen ?? 0) > 0
          ? Math.round(((byType.MULTIPLE_CHOICE?.correct ?? 0) / (byType.MULTIPLE_CHOICE?.seen ?? 1)) * 100)
          : 0,
    },
    TRUE_FALSE: {
      seen: byType.TRUE_FALSE?.seen ?? 0,
      correct: byType.TRUE_FALSE?.correct ?? 0,
      accuracyPct:
        (byType.TRUE_FALSE?.seen ?? 0) > 0
          ? Math.round(((byType.TRUE_FALSE?.correct ?? 0) / (byType.TRUE_FALSE?.seen ?? 1)) * 100)
          : 0,
    },
    CHECKBOX: {
      seen: byType.CHECKBOX?.seen ?? 0,
      correct: byType.CHECKBOX?.correct ?? 0,
      accuracyPct:
        (byType.CHECKBOX?.seen ?? 0) > 0
          ? Math.round(((byType.CHECKBOX?.correct ?? 0) / (byType.CHECKBOX?.seen ?? 1)) * 100)
          : 0,
      checkboxPatterns: {
        avgMissedCorrectOptions:
          (byType.CHECKBOX as { checkboxMissedCorrect?: number[] })?.checkboxMissedCorrect?.length ?? 0
            ? (byType.CHECKBOX as { checkboxMissedCorrect: number[] }).checkboxMissedCorrect.reduce(
                (a, b) => a + b,
                0
              ) /
              (byType.CHECKBOX as { checkboxMissedCorrect: number[] }).checkboxMissedCorrect.length
            : 0,
        avgExtraWrongOptions:
          (byType.CHECKBOX as { checkboxExtraWrong?: number[] })?.checkboxExtraWrong?.length ?? 0
            ? (byType.CHECKBOX as { checkboxExtraWrong: number[] }).checkboxExtraWrong.reduce(
                (a, b) => a + b,
                0
              ) /
              (byType.CHECKBOX as { checkboxExtraWrong: number[] }).checkboxExtraWrong.length
            : 0,
      },
    },
  };

  return {
    quiz: {
      id: quiz.id,
      name: quiz.name,
      questionsCount,
      settingsSummary,
    },
    participant: { id: participant.id, name: participant.name },
    totals: {
      attemptsCount: attempts.length,
      answersCount,
      correctCount,
      accuracyPct,
      avgTimePerQuestionSec,
      lastAttemptAt: lastAttemptAt ? lastAttemptAt.toISOString() : null,
      trend,
    },
    byQuestionType,
    mostMissedQuestions: mostMissed,
    timePressureSignals: { tooFastQuestions, tooSlowQuestions },
    examples,
    constraints: {
      language: "fr",
      maxReportLength: "medium",
      focus: ["strengths", "weaknesses", "recurring questions", "why", "study plan"],
    },
  };
}
