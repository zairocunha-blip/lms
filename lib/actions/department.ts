"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";
import { departmentSchema } from "@/lib/validations/department";
import * as departmentService from "@/lib/services/department";
import { DepartmentInUseError } from "@/lib/services/department";
import type { ActionState } from "@/lib/actions/auth";

// A lista de departamentos alimenta os formulários de usuário — revalidamos
// essas telas junto com a de gerenciamento.
function revalidateDepartmentViews() {
  revalidatePath("/admin/departamentos");
  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/usuarios/novo");
}

export async function createDepartmentAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = departmentSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Verifique os campos e tente novamente." };
  }

  try {
    await departmentService.createDepartment(parsed.data.name, admin.id);
  } catch {
    return { error: "Já existe um departamento com este nome." };
  }

  revalidateDepartmentViews();
  return { success: "Departamento criado." };
}

export async function renameDepartmentAction(id: string, name: string): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = departmentSchema.safeParse({ name });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Nome inválido." };
  }

  try {
    await departmentService.renameDepartment(id, parsed.data.name, admin.id);
  } catch {
    return { error: "Já existe um departamento com este nome." };
  }

  revalidateDepartmentViews();
  return { success: "Departamento renomeado." };
}

export async function deleteDepartmentAction(id: string): Promise<ActionState> {
  const admin = await requireAdmin();

  try {
    await departmentService.deleteDepartment(id, admin.id);
  } catch (error) {
    if (error instanceof DepartmentInUseError) return { error: error.message };
    throw error;
  }

  revalidateDepartmentViews();
  return { success: "Departamento excluído." };
}
