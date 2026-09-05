import { z } from "zod";

export const quizSettingsSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2, "Informe o título da prova."),
  description: z.string().optional(),
  passingScore: z.coerce.number().int().min(0).max(100),
  maxAttempts: z.coerce.number().int().min(1, "Mínimo de 1 tentativa.").max(10, "Máximo de 10 tentativas."),
  isActive: z.coerce.boolean(),
});
export type QuizSettingsInput = z.infer<typeof quizSettingsSchema>;

export const quizQuestionSchema = z.object({
  prompt: z.string().min(2, "Informe o enunciado da questão."),
  points: z.coerce.number().int().min(1).max(100),
});
export type QuizQuestionInput = z.infer<typeof quizQuestionSchema>;

export const quizOptionSchema = z.object({
  text: z.string().min(1, "Informe o texto da alternativa."),
  isCorrect: z.coerce.boolean(),
});
export type QuizOptionInput = z.infer<typeof quizOptionSchema>;

export const submitAttemptSchema = z.object({
  quizId: z.string().min(1),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        selectedOptionId: z.string().optional(),
        textResponse: z.string().optional(),
      })
    )
    .min(1, "Responda a prova antes de enviar."),
});
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;

export const reviewAttemptSchema = z.object({
  attemptId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().optional(),
  grades: z
    .array(
      z.object({
        answerId: z.string().min(1),
        isCorrect: z.coerce.boolean(),
        awardedPoints: z.coerce.number().int().min(0).optional(),
      })
    )
    .default([]),
});
export type ReviewAttemptInput = z.infer<typeof reviewAttemptSchema>;
