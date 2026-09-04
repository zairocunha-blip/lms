import { z } from "zod";
import { DEFAULT_PASSWORD } from "@/lib/auth/default-password";

export const loginSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail.").email("E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
});
export type LoginInput = z.infer<typeof loginSchema>;

const passwordRules = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .regex(/[a-z]/, "A senha deve conter ao menos uma letra minúscula.")
  .regex(/[A-Z]/, "A senha deve conter ao menos uma letra maiúscula.")
  .regex(/[0-9]/, "A senha deve conter ao menos um número.")
  // Sem esta regra o usuário poderia "trocar" a senha padrão por ela mesma e
  // continuar com a credencial conhecida pelo administrador.
  .refine((value) => value !== DEFAULT_PASSWORD, "Escolha uma senha diferente da senha padrão.");

/**
 * Troca obrigatória do primeiro acesso: o usuário acabou de autenticar com a
 * senha padrão no login, então só pedimos a nova senha e a confirmação. A
 * regra de "não pode ser a senha padrão" já vem de `passwordRules`.
 */
export const firstAccessPasswordSchema = z
  .object({
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });
export type FirstAccessPasswordInput = z.infer<typeof firstAccessPasswordSchema>;

/**
 * Troca voluntária (usuário já tem uma senha própria): exige a senha atual e
 * a nova precisa ser diferente dela.
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Informe sua senha atual."),
    password: passwordRules,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.password !== data.currentPassword, {
    message: "A nova senha deve ser diferente da senha atual.",
    path: ["password"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
