"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { markLessonCompleted } from "@/lib/services/progress";

/**
 * Marca a aula atual como concluída (Regra 5) e navega para a próxima aula
 * não concluída do curso, ou de volta à visão geral quando não há próxima.
 */
export async function completeLessonAction(formData: FormData) {
  const user = await requireUser();
  const lessonId = String(formData.get("lessonId"));
  const courseId = String(formData.get("courseId"));

  await markLessonCompleted(user.id, lessonId);
  revalidatePath(`/cursos/${courseId}`);

  const [modules, lessonProgress] = await Promise.all([
    prisma.courseModule.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: { lessons: { orderBy: { order: "asc" }, select: { id: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: { userId: user.id, status: "COMPLETED", lesson: { module: { courseId } } },
      select: { lessonId: true },
    }),
  ]);

  const completedIds = new Set(lessonProgress.map((p) => p.lessonId));
  const orderedLessonIds = modules.flatMap((m) => m.lessons.map((l) => l.id));
  const nextLessonId = orderedLessonIds.find((id) => !completedIds.has(id));

  if (nextLessonId) {
    redirect(`/cursos/${courseId}/aula/${nextLessonId}`);
  }
  redirect(`/cursos/${courseId}`);
}
