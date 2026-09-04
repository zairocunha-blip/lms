import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Informe o nome completo."),
  email: z.string().email("E-mail inválido."),
  jobTitle: z.string().optional(),
  departmentId: z.string().optional().nullable(),
  roleCode: z.enum(["ADMIN", "EMPLOYEE"]),
  hiredAt: z.string().optional().nullable(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = createUserSchema.extend({
  id: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE", "PENDING"]),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// A foto de perfil é enviada como arquivo e tratada fora do Zod (ver
// `updateOwnProfileAction`); aqui validamos apenas os campos de texto.
export const updateOwnProfileSchema = z.object({
  name: z.string().min(2, "Informe o nome completo."),
});
export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;
