"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin, requireUser } from "@/lib/auth/permissions";
import { reorderSchema } from "@/lib/validations/course";
import {
  quizSettingsSchema,
  quizQuestionSchema,
  quizOptionSchema,
  submitAttemptSchema,
  reviewAttemptSchema,
} from "@/lib/validations/quiz";
import * as quizService from "@/lib/services/quiz";
import { prisma } from "@/lib/db/prisma";
import type { ActionState } from "@/lib/actions/auth";
import type { QuizQuestionType } from "@prisma/client";

function revalidateEditor(courseId: string) {
  revalidatePath(`/admin/cursos/${courseId}/editar`);
}

// --- Configuração da prova --------------------------------------------------

export async function enableQuizAction(courseId: string) {
  const admin = await requireAdmin();
  await quizService.ensureQuiz(courseId, admin.id);
  revalidateEditor(courseId);
}

export async function disableQuizAction(courseId: string) {
  const admin = await requireAdmin();
  await quizService.setQuizActive(courseId, false, admin.id);
  revalidateEditor(courseId);
}

export async function updateQuizSettingsAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = quizSettingsSchema.safeParse({
    courseId: formData.get("courseId"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    passingScore: formData.get("passingScore"),
    maxAttempts: formData.get("maxAttempts"),
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });

  if (!parsed.success) {
    return { error: "Verifique os campos da prova.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await quizService.updateQuizSettings(parsed.data, admin.id);
  revalidateEditor(parsed.data.courseId);
  return { success: "Prova atualizada." };
}

// --- Questões --------------------------------------------------------------

export async function createQuestionAction(courseId: string, quizId: string, type: QuizQuestionType) {
  await requireAdmin();
  await quizService.createQuestion(quizId, type);
  revalidateEditor(courseId);
}

export async function updateQuestionAction(
  courseId: string,
  questionId: string,
  data: { prompt: string; points: number }
) {
  await requireAdmin();
  const parsed = quizQuestionSchema.safeParse(data);
  if (!parsed.success) return;
  await quizService.updateQuestion(questionId, parsed.data);
  revalidateEditor(courseId);
}

export async function deleteQuestionAction(courseId: string, questionId: string) {
  await requireAdmin();
  await quizService.deleteQuestion(questionId);
  revalidateEditor(courseId);
}

export async function reorderQuestionsAction(courseId: string, items: { id: string; order: number }[]) {
  await requireAdmin();
  const parsed = reorderSchema.safeParse({ items });
  if (!parsed.success) return;
  await quizService.reorderQuestions(parsed.data.items);
  revalidateEditor(courseId);
}

// --- Alternativas -------------------------------------------------------------

export async function createOptionAction(courseId: string, questionId: string) {
  await requireAdmin();
  await quizService.createOption(questionId);
  revalidateEditor(courseId);
}

export async function updateOptionAction(
  courseId: string,
  optionId: string,
  data: { text: string; isCorrect: boolean }
) {
  await requireAdmin();
  const parsed = quizOptionSchema.safeParse(data);
  if (!parsed.success) return;
  await quizService.updateOption(optionId, parsed.data);
  revalidateEditor(courseId);
}

export async function setCorrectOptionAction(courseId: string, questionId: string, optionId: string) {
  await requireAdmin();
  await quizService.setCorrectOption(questionId, optionId);
  revalidateEditor(courseId);
}

export async function deleteOptionAction(courseId: string, optionId: string) {
  await requireAdmin();
  await quizService.deleteOption(optionId);
  revalidateEditor(courseId);
}

// --- Envio da prova (colaborador) ------------------------------------------

export async function submitAttemptAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const raw = formData.get("payload");
  let payload: unknown;
  try {
    payload = JSON.parse(String(raw ?? ""));
  } catch {
    return { error: "Não foi possível ler as respostas. Tente novamente." };
  }

  const parsed = submitAttemptSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Responda todas as questões antes de enviar." };
  }

  const quiz = await prisma.quiz.findUnique({
    where: { id: parsed.data.quizId },
    select: { courseId: true },
  });
  if (!quiz) return { error: "Prova indisponível." };

  try {
    await quizService.submitAttempt(user.id, parsed.data);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível enviar a prova." };
  }

  revalidatePath(`/cursos/${quiz.courseId}`);
  redirect(`/cursos/${quiz.courseId}`);
}

// --- Correção (admin) -----------------------------------------------------

export async function reviewAttemptAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const admin = await requireAdmin();

  const raw = formData.get("payload");
  let payload: unknown;
  try {
    payload = JSON.parse(String(raw ?? ""));
  } catch {
    return { error: "Não foi possível ler a correção. Tente novamente." };
  }

  const parsed = reviewAttemptSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: "Verifique a correção e tente novamente." };
  }

  try {
    await quizService.reviewAttempt(parsed.data.attemptId, parsed.data, admin.id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível salvar a correção." };
  }

  revalidatePath("/admin/provas");
  revalidatePath("/admin/progresso");
  redirect("/admin/provas");
}
