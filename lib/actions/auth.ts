"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { requireUser } from "@/lib/auth/permissions";
import { loginSchema, changePasswordSchema, firstAccessPasswordSchema } from "@/lib/validations/auth";

export interface ActionState {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function loginAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Verifique os campos e tente novamente.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      // Mensagem genérica — nunca revela se o e-mail existe ou se foi a
      // senha que está incorreta (evita enumeração de contas).
      return { error: "E-mail ou senha inválidos." };
    }
    throw error;
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

/**
 * Troca a senha do usuário autenticado. Cobre dois casos:
 *
 * - Primeiro acesso (`mustChangePassword`): o usuário acabou de autenticar com
 *   a senha padrão no login, então pedimos apenas a nova senha + confirmação.
 * - Troca voluntária: o usuário já tem senha própria e precisa confirmar a
 *   senha atual (uma sessão aberta herdada não basta para trocá-la).
 *
 * O modo é decidido pela flag no banco, nunca por um campo do formulário.
 */
export async function changePasswordAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const sessionUser = await requireUser();

  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  if (!user?.passwordHash) return { error: "Não foi possível validar sua conta. Faça login novamente." };

  let newPassword: string;

  if (user.mustChangePassword) {
    const parsed = firstAccessPasswordSchema.safeParse({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return {
        error: fieldErrors.password?.[0] ?? fieldErrors.confirmPassword?.[0] ?? "Verifique os campos e tente novamente.",
        fieldErrors,
      };
    }
    newPassword = parsed.data.password;
  } else {
    const parsed = changePasswordSchema.safeParse({
      currentPassword: formData.get("currentPassword"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return {
        error:
          fieldErrors.currentPassword?.[0] ??
          fieldErrors.password?.[0] ??
          fieldErrors.confirmPassword?.[0] ??
          "Verifique os campos e tente novamente.",
        fieldErrors,
      };
    }

    const currentMatches = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!currentMatches) {
      return { error: "Senha atual incorreta.", fieldErrors: { currentPassword: ["Senha atual incorreta."] } };
    }
    newPassword = parsed.data.password;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false, status: "ACTIVE" },
  });

  // A flag `mustChangePassword` vive dentro do JWT já emitido; encerrar a
  // sessão é a forma mais simples de garantir que o próximo acesso use um
  // token atualizado, sem depender de revalidação de sessão.
  await signOut({ redirectTo: "/login?senha-alterada=1" });
  return {};
}
