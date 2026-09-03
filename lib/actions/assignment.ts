"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";
import { assignCourseSchema } from "@/lib/validations/course";
import * as assignmentService from "@/lib/services/assignment";
import type { ActionState } from "@/lib/actions/auth";

export async function assignCourseAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const userIds = formData.getAll("userIds").map(String);
  const departmentIds = formData.getAll("departmentIds").map(String);

  const parsed = assignCourseSchema.safeParse({
    courseId: formData.get("courseId"),
    userIds,
    departmentIds,
    assignToAll: formData.get("assignToAll") === "on",
  });

  if (!parsed.success) {
    return { error: "Selecione um curso e ao menos um destinatário." };
  }

  try {
    const { assignedCount } = await assignmentService.assignCourse(parsed.data, admin.id);
    revalidatePath("/admin/progresso");
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin/cursos");
    return { success: `Curso atribuído a ${assignedCount} colaborador(es).` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível atribuir o curso." };
  }
}

export async function removeAssignmentAction(assignmentId: string) {
  const admin = await requireAdmin();
  await assignmentService.removeAssignment(assignmentId, admin.id);
  revalidatePath("/admin/progresso");
  revalidatePath("/admin/usuarios");
}
