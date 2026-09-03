import "server-only";
import { prisma } from "@/lib/db/prisma";
import { notify } from "@/lib/services/notification";

/**
 * Recalcula o CourseProgress de um usuário a partir das LessonProgress
 * existentes. É a única função que deve escrever em CourseProgress —
 * mantém a Regra 6 (o percentual é sempre derivado, nunca editado
 * manualmente) em um único lugar.
 */
async function recalculateCourseProgress(userId: string, courseId: string) {
  const totalLessons = await prisma.lesson.count({
    where: { module: { courseId } },
  });

  const completedLessons = await prisma.lessonProgress.count({
    where: {
      userId,
      status: "COMPLETED",
      lesson: { module: { courseId } },
    },
  });

  const percentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
  const isCompleted = totalLessons > 0 && completedLessons === totalLessons;

  const existing = await prisma.courseProgress.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  const courseProgress = await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: {
      userId,
      courseId,
      percentage,
      startedAt: new Date(),
      completedAt: isCompleted ? new Date() : null,
    },
    update: {
      percentage,
      completedAt: isCompleted ? existing?.completedAt ?? new Date() : null,
    },
  });

  await prisma.courseAssignment.update({
    where: { userId_courseId: { userId, courseId } },
    data: {
      status: isCompleted ? "COMPLETED" : percentage > 0 ? "IN_PROGRESS" : "NOT_STARTED",
      completedAt: isCompleted ? courseProgress.completedAt : null,
    },
  });

  if (isCompleted && !existing?.completedAt) {
    await notify(userId, "COURSE_COMPLETED", "Você concluiu um curso. Confira seu histórico.");
  }

  return courseProgress;
}

/** Marca uma aula como iniciada (idempotente) e atualiza a "última aula acessada". */
export async function markLessonStarted(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  const courseId = lesson.module.courseId;

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, status: "STARTED" },
    update: {},
  });

  await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, percentage: 0, startedAt: new Date(), lastLessonId: lessonId },
    update: { lastLessonId: lessonId },
  });

  await prisma.courseAssignment.update({
    where: { userId_courseId: { userId, courseId } },
    data: { status: "IN_PROGRESS" },
  }).catch(() => {
    // Se não houver CourseAssignment (curso acessado fora de uma atribuição
    // formal), simplesmente ignora — o progresso ainda é registrado.
  });
}

/** Marca uma aula como concluída e recalcula o progresso do curso (Regra 5 e 6). */
export async function markLessonCompleted(userId: string, lessonId: string) {
  const lesson = await prisma.lesson.findUniqueOrThrow({
    where: { id: lessonId },
    select: { module: { select: { courseId: true } } },
  });
  const courseId = lesson.module.courseId;

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, status: "COMPLETED", completedAt: new Date() },
    update: { status: "COMPLETED", completedAt: new Date() },
  });

  return recalculateCourseProgress(userId, courseId);
}

export async function getCourseProgressSummary(userId: string, courseId: string) {
  const [progress, lessonProgress] = await Promise.all([
    prisma.courseProgress.findUnique({ where: { userId_courseId: { userId, courseId } } }),
    prisma.lessonProgress.findMany({
      where: { userId, lesson: { module: { courseId } } },
      select: { lessonId: true, status: true },
    }),
  ]);

  const completedLessonIds = new Set(
    lessonProgress.filter((p) => p.status === "COMPLETED").map((p) => p.lessonId)
  );

  return { progress, completedLessonIds };
}
