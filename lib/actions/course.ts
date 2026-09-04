"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/permissions";
import { courseSchema, lessonContentSchema, reorderSchema } from "@/lib/validations/course";
import * as courseService from "@/lib/services/course";
import type { ActionState } from "@/lib/actions/auth";

export async function createCourseAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    coverUrl: formData.get("coverUrl") || undefined,
    categoryId: formData.get("categoryId") || null,
    status: formData.get("status") ?? "DRAFT",
  });

  if (!parsed.success) {
    return { error: "Verifique os campos e tente novamente.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const course = await courseService.createCourse(parsed.data, admin.id);
  revalidatePath("/admin/cursos");
  redirect(`/admin/cursos/${course.id}/editar`);
}

export async function updateCourseAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const courseId = String(formData.get("courseId"));

  const parsed = courseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    coverUrl: formData.get("coverUrl") || undefined,
    categoryId: formData.get("categoryId") || null,
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: "Verifique os campos e tente novamente.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await courseService.updateCourse(courseId, parsed.data, admin.id);
  revalidatePath("/admin/cursos");
  revalidatePath(`/admin/cursos/${courseId}/editar`);
  return { success: "Curso atualizado." };
}

export async function archiveCourseAction(courseId: string) {
  const admin = await requireAdmin();
  await courseService.archiveCourse(courseId, admin.id);
  revalidatePath("/admin/cursos");
}

export async function deleteCourseAction(courseId: string): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  try {
    await courseService.deleteCourse(courseId, admin.id);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível excluir o curso." };
  }
  revalidatePath("/admin/cursos");
  return {};
}

export async function duplicateCourseAction(courseId: string) {
  const admin = await requireAdmin();
  const duplicate = await courseService.duplicateCourse(courseId, admin.id);
  revalidatePath("/admin/cursos");
  redirect(`/admin/cursos/${duplicate.id}/editar`);
}

// --- Módulos -----------------------------------------------------------------

export async function createModuleAction(courseId: string, title: string) {
  await requireAdmin();
  await courseService.createModule(courseId, title);
  revalidatePath(`/admin/cursos/${courseId}/editar`);
}

export async function renameModuleAction(courseId: string, moduleId: string, title: string) {
  await requireAdmin();
  await courseService.renameModule(moduleId, title);
  revalidatePath(`/admin/cursos/${courseId}/editar`);
}

export async function deleteModuleAction(courseId: string, moduleId: string) {
  await requireAdmin();
  await courseService.deleteModule(moduleId);
  revalidatePath(`/admin/cursos/${courseId}/editar`);
}

export async function reorderModulesAction(courseId: string, items: { id: string; order: number }[]) {
  await requireAdmin();
  const parsed = reorderSchema.safeParse({ items });
  if (!parsed.success) return;
  await courseService.reorderModules(parsed.data.items);
  revalidatePath(`/admin/cursos/${courseId}/editar`);
}

// --- Aulas ---------------------------------------------------------------------

export async function createLessonAction(courseId: string, moduleId: string, title: string) {
  await requireAdmin();
  await courseService.createLesson(moduleId, title);
  revalidatePath(`/admin/cursos/${courseId}/editar`);
}

export async function renameLessonAction(courseId: string, lessonId: string, title: string) {
  await requireAdmin();
  await courseService.renameLesson(lessonId, title);
  revalidatePath(`/admin/cursos/${courseId}/editar`);
}

export async function deleteLessonAction(courseId: string, lessonId: string) {
  await requireAdmin();
  await courseService.deleteLesson(lessonId);
  revalidatePath(`/admin/cursos/${courseId}/editar`);
}

export async function reorderLessonsAction(courseId: string, items: { id: string; order: number }[]) {
  await requireAdmin();
  const parsed = reorderSchema.safeParse({ items });
  if (!parsed.success) return;
  await courseService.reorderLessons(parsed.data.items);
  revalidatePath(`/admin/cursos/${courseId}/editar`);
}

export async function saveLessonContentAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const courseId = String(formData.get("courseId"));

  const parsed = lessonContentSchema.safeParse({
    lessonId: formData.get("lessonId"),
    type: formData.get("type"),
    body: formData.get("body") || undefined,
    fileUrl: formData.get("fileUrl") || undefined,
    fileName: formData.get("fileName") || undefined,
  });

  if (!parsed.success) {
    return { error: "Verifique o conteúdo da aula." };
  }

  await courseService.upsertLessonContent(parsed.data);
  revalidatePath(`/admin/cursos/${courseId}/editar`);
  return { success: "Conteúdo salvo." };
}

// --- Categorias ------------------------------------------------------------------

export async function createCategoryAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Informe um nome válido para a categoria." };

  try {
    await courseService.createCategory(name);
  } catch {
    return { error: "Já existe uma categoria com este nome." };
  }
  revalidatePath("/admin/categorias");
  return { success: "Categoria criada." };
}

export async function toggleCategoryAction(id: string, isActive: boolean) {
  await requireAdmin();
  await courseService.updateCategory(id, { isActive });
  revalidatePath("/admin/categorias");
}

export async function deleteCategoryAction(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  try {
    await courseService.deleteCategory(id);
  } catch {
    return { error: "Não foi possível excluir a categoria." };
  }
  revalidatePath("/admin/categorias");
  revalidatePath("/admin/cursos");
  return {};
}
