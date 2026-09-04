"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db/prisma";
import { updateOwnProfileSchema } from "@/lib/validations/user";
import { saveUpload, deleteLocalUpload, UploadError } from "@/lib/uploads";
import type { ActionState } from "@/lib/actions/auth";

export async function updateOwnProfileAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const parsed = updateOwnProfileSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return { error: "Verifique os campos e tente novamente.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const avatarFile = formData.get("avatar");
  const removeAvatar = formData.get("removeAvatar") === "1";

  // `avatarUrl` só entra no update quando há uma foto nova ou uma remoção
  // explícita — assim um envio sem mexer na foto preserva a atual.
  const data: { name: string; avatarUrl?: string | null } = { name: parsed.data.name };

  const { avatarUrl: currentAvatarUrl } = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { avatarUrl: true },
  });

  if (avatarFile instanceof File && avatarFile.size > 0) {
    try {
      const { url } = await saveUpload(avatarFile, "avatar");
      data.avatarUrl = url;
    } catch (error) {
      if (error instanceof UploadError) {
        return { error: error.message, fieldErrors: { avatar: [error.message] } };
      }
      throw error;
    }
    await deleteLocalUpload(currentAvatarUrl);
  } else if (removeAvatar) {
    data.avatarUrl = null;
    await deleteLocalUpload(currentAvatarUrl);
  }

  await prisma.user.update({ where: { id: user.id }, data });

  revalidatePath("/perfil");
  revalidatePath("/admin/perfil");
  return { success: "Perfil atualizado com sucesso." };
}
