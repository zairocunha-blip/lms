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

export const updateOwnProfileSchema = z.object({
  name: z.string().min(2, "Informe o nome completo."),
  avatarUrl: z.string().url().optional().or(z.literal("")),
});
export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;
