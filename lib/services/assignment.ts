import "server-only";
import { prisma } from "@/lib/db/prisma";
import { logAction } from "@/lib/services/audit";
import { notifyMany } from "@/lib/services/notification";
import type { AssignCourseInput } from "@/lib/validations/course";
import type { Prisma } from "@prisma/client";

/** Resolve a lista final de usuários-alvo a partir de indivíduos, departamentos ou "todos". */
async function resolveTargetUserIds(input: AssignCourseInput): Promise<string[]> {
  if (input.assignToAll) {
    const users = await prisma.user.findMany({ where: { status: "ACTIVE" }, select: { id: true } });
    return users.map((u) => u.id);
  }

  const ids = new Set<string>(input.userIds);

  if (input.departmentIds.length > 0) {
    const users = await prisma.user.findMany({
      where: { departmentId: { in: input.departmentIds }, status: "ACTIVE" },
      select: { id: true },
    });
    users.forEach((u) => ids.add(u.id));
  }

  return Array.from(ids);
}

export async function assignCourse(input: AssignCourseInput, actorId: string) {
  const targetUserIds = await resolveTargetUserIds(input);
  if (targetUserIds.length === 0) {
    throw new Error("Selecione ao menos um colaborador, departamento ou todos os colaboradores.");
  }

  const course = await prisma.course.findUniqueOrThrow({ where: { id: input.courseId } });

  await prisma.$transaction(
    targetUserIds.map((userId) =>
      prisma.courseAssignment.upsert({
        where: { userId_courseId: { userId, courseId: input.courseId } },
        create: { userId, courseId: input.courseId, assignedById: actorId },
        update: {},
      })
    )
  );

  await notifyMany(targetUserIds, "COURSE_ASSIGNED", `Novo curso disponível: ${course.title}`);
  await logAction({
    actorId,
    action: "COURSE_ASSIGNED",
    entityType: "Course",
    entityId: input.courseId,
    metadata: { userCount: targetUserIds.length },
  });

  return { assignedCount: targetUserIds.length };
}

export async function removeAssignment(assignmentId: string, actorId: string) {
  const assignment = await prisma.courseAssignment.delete({ where: { id: assignmentId } });
  await prisma.courseProgress
    .delete({ where: { userId_courseId: { userId: assignment.userId, courseId: assignment.courseId } } })
    .catch(() => undefined);

  await logAction({
    actorId,
    action: "COURSE_ASSIGNMENT_REMOVED",
    entityType: "CourseAssignment",
    entityId: assignmentId,
  });
}

interface TrackProgressParams {
  courseId?: string;
  userId?: string;
  departmentId?: string;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export async function trackProgress(params: TrackProgressParams) {
  const { courseId, userId, departmentId, status, dateFrom, dateTo, page = 1, pageSize = 20 } = params;

  const where: Prisma.CourseAssignmentWhereInput = {
    ...(courseId ? { courseId } : {}),
    ...(userId ? { userId } : {}),
    ...(status ? { status } : {}),
    ...(departmentId ? { user: { departmentId } } : {}),
    ...(dateFrom || dateTo
      ? {
          assignedAt: {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59`) } : {}),
          },
        }
      : {}),
  };

  const [assignments, total] = await Promise.all([
    prisma.courseAssignment.findMany({
      where,
      include: {
        user: { include: { department: true } },
        course: true,
      },
      orderBy: { assignedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.courseAssignment.count({ where }),
  ]);

  const progressByKey = await prisma.courseProgress.findMany({
    where: {
      userId: { in: assignments.map((a) => a.userId) },
      courseId: { in: assignments.map((a) => a.courseId) },
    },
  });
  const progressMap = new Map(progressByKey.map((p) => [`${p.userId}:${p.courseId}`, p]));

  const rows = assignments.map((assignment) => ({
    assignment,
    progress: progressMap.get(`${assignment.userId}:${assignment.courseId}`) ?? null,
  }));

  return { rows, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
