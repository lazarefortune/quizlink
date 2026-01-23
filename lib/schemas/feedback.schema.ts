import { z } from "zod";

export const feedbackTypeSchema = z.enum(["BUG", "SUGGESTION", "FEEDBACK"]);

export const feedbackStatusSchema = z.enum(["NEW", "IN_PROGRESS", "DONE"]);

export const submitFeedbackSchema = z.object({
  type: feedbackTypeSchema,
  message: z
    .string()
    .min(10, "Le message doit contenir au moins 10 caractères")
    .max(2000, "Le message ne peut pas dépasser 2000 caractères"),
  page: z.string().max(500),
  userAgent: z.string().max(500),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type FeedbackType = z.infer<typeof feedbackTypeSchema>;
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>;
