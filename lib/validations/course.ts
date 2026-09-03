import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().min(3, "Informe o nome do curso."),
  description: z.string().optional(),
  coverUrl: z.string().optional(),
  categoryId: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
});
export type CourseInput = z.infer<typeof courseSchema>;

export const moduleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2, "Informe o nome do módulo."),
});
export type ModuleInput = z.infer<typeof moduleSchema>;

export const lessonSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(2, "Informe o nome da aula."),
});
export type LessonInput = z.infer<typeof lessonSchema>;

export const lessonContentSchema = z.object({
  lessonId: z.string().min(1),
  type: z.enum(["MARKDOWN", "SLIDES"]),
  body: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
});
export type LessonContentInput = z.infer<typeof lessonContentSchema>;

export const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string(), order: z.number().int() })),
});
export type ReorderInput = z.infer<typeof reorderSchema>;

export const categorySchema = z.object({
  name: z.string().min(2, "Informe o nome da categoria."),
  isActive: z.boolean().default(true),
});
export type CategoryInput = z.infer<typeof categorySchema>;

export const assignCourseSchema = z.object({
  courseId: z.string().min(1),
  userIds: z.array(z.string()).optional().default([]),
  departmentIds: z.array(z.string()).optional().default([]),
  assignToAll: z.boolean().optional().default(false),
});
export type AssignCourseInput = z.infer<typeof assignCourseSchema>;
