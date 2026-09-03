"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { updateOwnProfileSchema } from "@/lib/validations/user";
import type { ActionState } from "@/lib/actions/auth";

export async function updateOwnProfileAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = updateOwnProfileSchema.safeParse({
    name: formData.get("name"),
    avatarUrl: formData.get("avatarUrl") ?? "",
  });

  if (!parsed.success) {
    return { error: "Verifique os campos e tente novamente.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, avatarUrl: parsed.data.avatarUrl || null },
  });

  revalidatePath("/perfil");
  return { success: "Perfil atualizado com sucesso." };
}
