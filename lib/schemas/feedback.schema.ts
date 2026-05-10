import { z } from "zod";

export const feedbackTypeSchema = z.enum(["BUG", "SUGGESTION", "FEEDBACK"]);

export const feedbackStatusSchema = z.enum(["NEW", "IN_PROGRESS", "DONE"]);

export const submitFeedbackSchema = z.object({
  type: feedbackTypeSchema,
  message: z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(5, "Le message doit contenir au moins 5 caractères")
        .max(2000, "Le message ne peut pas dépasser 2000 caractères"),
    ),
  page: z
    .string()
    .max(500)
    .transform((value) => value.trim())
    .pipe(
      z
        .string()
        .min(1, "Chemin de page invalide")
        .refine((pathValue) => pathValue.startsWith("/"), {
          message: "Chemin de page invalide",
        })
        .refine((pathValue) => !/[\x00-\x1f]/.test(pathValue), {
          message: "Chemin de page invalide",
        }),
    ),
  userAgent: z
    .string()
    .max(500)
    .refine((ua) => !/[\r\n]/.test(ua), {
      message: "User-Agent invalide",
    }),
});

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
export type FeedbackType = z.infer<typeof feedbackTypeSchema>;
export type FeedbackStatus = z.infer<typeof feedbackStatusSchema>;
