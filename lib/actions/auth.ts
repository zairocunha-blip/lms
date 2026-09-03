"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { loginSchema, forgotPasswordSchema, setPasswordSchema } from "@/lib/validations/auth";
import { createPasswordToken, verifyPasswordToken, consumePasswordToken } from "@/lib/auth/tokens";
import { resetEmailTemplate, sendMail } from "@/lib/email/mailer";

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
      redirectTo: "/home",
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

export async function requestPasswordResetAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { error: "Informe um e-mail válido.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const genericSuccess: ActionState = {
    success: "Se este e-mail estiver cadastrado, enviaremos um link de redefinição em instantes.",
  };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  // Mesma resposta independentemente do usuário existir — impede que a tela
  // seja usada para descobrir quais e-mails estão cadastrados na empresa.
  if (!user || user.status !== "ACTIVE") return genericSuccess;

  const token = await createPasswordToken(user.id, "RESET");
  const link = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/redefinir-senha/${token}`;
  const { subject, html } = resetEmailTemplate({ name: user.name, link });
  await sendMail({ to: user.email, subject, html });

  return genericSuccess;
}

export async function setNewPasswordAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = setPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.password?.[0] ?? "Verifique os campos e tente novamente.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const result = await verifyPasswordToken(parsed.data.token);
  if (!result.valid) {
    const messages = {
      not_found: "Link inválido.",
      used: "Este link já foi utilizado.",
      expired: "Este link expirou. Solicite um novo.",
    } as const;
    return { error: messages[result.reason] };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.update({
    where: { id: result.token.userId },
    data: { passwordHash, status: "ACTIVE" },
  });
  await consumePasswordToken(result.token.id);

  redirect("/login?senha-definida=1");
}
