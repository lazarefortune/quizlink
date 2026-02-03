import { z } from "zod";

export const participantReportSummarySchema = z.object({
  overallLevel: z.enum(["beginner", "intermediate", "advanced"]),
  oneSentence: z.string(),
  keyNumbers: z.array(z.string()),
});

export const participantReportStrengthWeaknessSchema = z.object({
  title: z.string(),
  evidence: z.string(),
  metric: z.string(),
});

export const participantReportRecurringMistakeSchema = z.object({
  pattern: z.string(),
  whyLikely: z.string(),
  howToFix: z.string(),
});

export const participantReportQuestionToReviewSchema = z.object({
  question: z.string(),
  whyMissed: z.string(),
  whatToRemember: z.string(),
});

export const participantReportStudyDaySchema = z.object({
  day: z.number().min(1).max(7),
  focus: z.string(),
  tasks: z.array(z.string()),
});

export const participantReportOutputSchema = z.object({
  summary: participantReportSummarySchema,
  strengths: z.array(participantReportStrengthWeaknessSchema),
  weaknesses: z.array(participantReportStrengthWeaknessSchema),
  recurringMistakes: z.array(participantReportRecurringMistakeSchema),
  mostImportantQuestionsToReview: z.array(participantReportQuestionToReviewSchema),
  studyPlan7Days: z.array(participantReportStudyDaySchema),
  tips: z.array(z.string()),
  warnings: z.array(z.string()),
});

export type ParticipantReportOutput = z.infer<typeof participantReportOutputSchema>;
