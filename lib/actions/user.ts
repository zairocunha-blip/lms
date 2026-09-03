"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/permissions";
import { createUserSchema, updateUserSchema } from "@/lib/validations/user";
import * as userService from "@/lib/services/user";
import type { ActionState } from "@/lib/actions/auth";

export async function createUserAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    jobTitle: formData.get("jobTitle") || undefined,
    departmentId: formData.get("departmentId") || null,
    roleCode: formData.get("roleCode"),
    hiredAt: formData.get("hiredAt") || null,
  });

  if (!parsed.success) {
    return { error: "Verifique os campos e tente novamente.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await userService.createUser(parsed.data, admin.id);
  } catch {
    return { error: "Não foi possível criar o usuário. Verifique se o e-mail já está em uso." };
  }

  revalidatePath("/admin/usuarios");
  return { success: "Usuário criado. Um convite foi enviado para definição de senha." };
}

export async function updateUserAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = updateUserSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    email: formData.get("email"),
    jobTitle: formData.get("jobTitle") || undefined,
    departmentId: formData.get("departmentId") || null,
    roleCode: formData.get("roleCode"),
    status: formData.get("status"),
    hiredAt: formData.get("hiredAt") || null,
  });

  if (!parsed.success) {
    return { error: "Verifique os campos e tente novamente.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await userService.updateUser(parsed.data, admin.id);
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${parsed.data.id}`);
  return { success: "Usuário atualizado com sucesso." };
}

export async function setUserStatusAction(userId: string, status: "ACTIVE" | "INACTIVE") {
  const admin = await requireAdmin();
  await userService.setUserStatus(userId, status, admin.id);
  revalidatePath("/admin/usuarios");
  revalidatePath(`/admin/usuarios/${userId}`);
}

export async function resendAccessAction(userId: string) {
  const admin = await requireAdmin();
  const link = await userService.resendAccess(userId, admin.id);
  revalidatePath(`/admin/usuarios/${userId}`);
  return link;
}
