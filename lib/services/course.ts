import "server-only";
import { prisma } from "@/lib/db/prisma";
import { logAction } from "@/lib/services/audit";
import type { CourseInput, LessonContentInput } from "@/lib/validations/course";
import type { Prisma } from "@prisma/client";

interface ListCoursesParams {
  search?: string;
  categoryId?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  page?: number;
  pageSize?: number;
}

export async function listCourses(params: ListCoursesParams) {
  const { search, categoryId, status, page = 1, pageSize = 12 } = params;

  const where: Prisma.CourseWhereInput = {
    ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(status ? { status } : {}),
  };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      include: {
        category: true,
        _count: { select: { assignments: true } },
        modules: { select: { _count: { select: { lessons: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.course.count({ where }),
  ]);

  return { courses, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export async function getCourseForEditing(courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: {
      category: true,
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" }, include: { content: true } } },
      },
    },
  });
}

/** Curso completo com estrutura, usado pela página de estudo do colaborador. */
export async function getCourseForLearner(courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId, status: "PUBLISHED" },
    include: {
      category: true,
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
    },
  });
}

/** Uma aula específica com seu conteúdo e o contexto do curso/módulo. */
export async function getLessonForLearner(lessonId: string) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      content: true,
      module: { include: { course: true } },
    },
  });
}

export async function createCourse(input: CourseInput, actorId: string) {
  const course = await prisma.course.create({
    data: {
      title: input.title,
      description: input.description || null,
      coverUrl: input.coverUrl || null,
      categoryId: input.categoryId || null,
      status: input.status,
      createdById: actorId,
    },
  });
  await logAction({ actorId, action: "COURSE_CREATED", entityType: "Course", entityId: course.id });
  return course;
}

export async function updateCourse(courseId: string, input: CourseInput, actorId: string) {
  const course = await prisma.course.update({
    where: { id: courseId },
    data: {
      title: input.title,
      description: input.description || null,
      coverUrl: input.coverUrl || null,
      categoryId: input.categoryId || null,
      status: input.status,
    },
  });
  await logAction({ actorId, action: "COURSE_UPDATED", entityType: "Course", entityId: course.id });
  return course;
}

/** Regra 7 — arquivar em vez de excluir preserva histórico de progresso. */
export async function archiveCourse(courseId: string, actorId: string) {
  const course = await prisma.course.update({ where: { id: courseId }, data: { status: "ARCHIVED" } });
  await logAction({ actorId, action: "COURSE_ARCHIVED", entityType: "Course", entityId: courseId });
  return course;
}

/** Exclusão definitiva — só é permitida quando o curso nunca foi atribuído. */
export async function deleteCourse(courseId: string, actorId: string) {
  const assignmentCount = await prisma.courseAssignment.count({ where: { courseId } });
  if (assignmentCount > 0) {
    throw new Error("Este curso já possui colaboradores atribuídos e não pode ser excluído. Arquive-o em vez disso.");
  }
  await prisma.course.delete({ where: { id: courseId } });
  await logAction({ actorId, action: "COURSE_DELETED", entityType: "Course", entityId: courseId });
}

export async function duplicateCourse(courseId: string, actorId: string) {
  const original = await getCourseForEditing(courseId);
  if (!original) throw new Error("Curso não encontrado.");

  const duplicate = await prisma.course.create({
    data: {
      title: `${original.title} (cópia)`,
      description: original.description,
      coverUrl: original.coverUrl,
      categoryId: original.categoryId,
      status: "DRAFT",
      createdById: actorId,
      modules: {
        create: original.modules.map((module) => ({
          title: module.title,
          order: module.order,
          lessons: {
            create: module.lessons.map((lesson) => ({
              title: lesson.title,
              order: lesson.order,
              content: lesson.content
                ? {
                    create: {
                      type: lesson.content.type,
                      body: lesson.content.body,
                      fileUrl: lesson.content.fileUrl,
                      fileName: lesson.content.fileName,
                    },
                  }
                : undefined,
            })),
          },
        })),
      },
    },
  });

  await logAction({ actorId, action: "COURSE_DUPLICATED", entityType: "Course", entityId: duplicate.id, metadata: { from: courseId } });
  return duplicate;
}

// --- Módulos e aulas -------------------------------------------------------

export async function createModule(courseId: string, title: string) {
  const lastModule = await prisma.courseModule.findFirst({ where: { courseId }, orderBy: { order: "desc" } });
  return prisma.courseModule.create({
    data: { courseId, title, order: (lastModule?.order ?? -1) + 1 },
  });
}

export async function renameModule(moduleId: string, title: string) {
  return prisma.courseModule.update({ where: { id: moduleId }, data: { title } });
}

export async function deleteModule(moduleId: string) {
  return prisma.courseModule.delete({ where: { id: moduleId } });
}

export async function reorderModules(items: { id: string; order: number }[]) {
  await prisma.$transaction(
    items.map((item) => prisma.courseModule.update({ where: { id: item.id }, data: { order: item.order } }))
  );
}

export async function createLesson(moduleId: string, title: string) {
  const lastLesson = await prisma.lesson.findFirst({ where: { moduleId }, orderBy: { order: "desc" } });
  return prisma.lesson.create({
    data: { moduleId, title, order: (lastLesson?.order ?? -1) + 1 },
  });
}

export async function renameLesson(lessonId: string, title: string) {
  return prisma.lesson.update({ where: { id: lessonId }, data: { title } });
}

export async function deleteLesson(lessonId: string) {
  return prisma.lesson.delete({ where: { id: lessonId } });
}

export async function reorderLessons(items: { id: string; order: number }[]) {
  await prisma.$transaction(
    items.map((item) => prisma.lesson.update({ where: { id: item.id }, data: { order: item.order } }))
  );
}

export async function upsertLessonContent(input: LessonContentInput) {
  return prisma.lessonContent.upsert({
    where: { lessonId: input.lessonId },
    create: {
      lessonId: input.lessonId,
      type: input.type,
      body: input.body || null,
      fileUrl: input.fileUrl || null,
      fileName: input.fileName || null,
    },
    update: {
      type: input.type,
      body: input.body || null,
      fileUrl: input.fileUrl || null,
      fileName: input.fileName || null,
    },
  });
}

// --- Categorias --------------------------------------------------------------

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { courses: true } } },
  });
}

export async function createCategory(name: string) {
  return prisma.category.create({ data: { name } });
}

export async function updateCategory(id: string, data: { name?: string; isActive?: boolean }) {
  return prisma.category.update({ where: { id }, data });
}

/**
 * Exclui a categoria. `Course.categoryId` é opcional com `ON DELETE SET NULL`
 * no banco, então cursos vinculados não são bloqueados nem apagados — apenas
 * ficam sem categoria.
 */
export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
}

// --- Consulta para o colaborador --------------------------------------------

/** Cursos atribuídos a um colaborador, com progresso e contagem de aulas. */
export async function getMyCourses(userId: string) {
  const assignments = await prisma.courseAssignment.findMany({
    where: { userId, course: { status: { not: "ARCHIVED" } } },
    include: {
      course: {
        include: {
          category: true,
          modules: { include: { lessons: { select: { id: true } } } },
        },
      },
    },
    orderBy: { assignedAt: "desc" },
  });

  const courseIds = assignments.map((a) => a.courseId);
  const progresses = await prisma.courseProgress.findMany({
    where: { userId, courseId: { in: courseIds } },
  });
  const progressMap = new Map(progresses.map((p) => [p.courseId, p]));

  const lastLessonIds = progresses.map((p) => p.lastLessonId).filter((id): id is string => !!id);
  const lastLessons = await prisma.lesson.findMany({
    where: { id: { in: lastLessonIds } },
    select: { id: true, title: true },
  });
  const lastLessonMap = new Map(lastLessons.map((l) => [l.id, l.title]));

  return assignments.map((assignment) => {
    const totalLessons = assignment.course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const progress = progressMap.get(assignment.courseId) ?? null;
    return {
      assignment,
      course: assignment.course,
      totalLessons,
      progress,
      lastLessonTitle: progress?.lastLessonId ? lastLessonMap.get(progress.lastLessonId) ?? null : null,
    };
  });
}
