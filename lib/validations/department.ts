import { z } from "zod";

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos 2 caracteres.")
    .max(60, "O nome pode ter no máximo 60 caracteres."),
});
export type DepartmentInput = z.infer<typeof departmentSchema>;
