"use client";

import { useActionState } from "react";
import { createCourseAction, updateCourseAction } from "@/lib/actions/course";
import type { ActionState } from "@/lib/actions/auth";
import { Label, FieldError } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileUploadField } from "@/components/admin/file-upload-field";

const initialState: ActionState = {};

interface CategoryOption {
  id: string;
  name: string;
}

interface ExistingCourse {
  id: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  categoryId: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}

export function CourseInfoForm({ categories, course }: { categories: CategoryOption[]; course?: ExistingCourse }) {
  const action = course ? updateCourseAction : createCourseAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {course && <input type="hidden" name="courseId" value={course.id} />}

      <div>
        <Label htmlFor="title">Nome do curso</Label>
        <Input id="title" name="title" defaultValue={course?.title} aria-invalid={!!state.fieldErrors?.title} required />
        <FieldError>{state.fieldErrors?.title?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea id="description" name="description" rows={3} defaultValue={course?.description ?? ""} />
      </div>

      <div>
        <Label>Capa do curso</Label>
        <FileUploadField name="coverUrl" kind="image" accept="image/png,image/jpeg,image/webp" label="Enviar imagem de capa" defaultValue={course?.coverUrl ?? ""} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="categoryId">Categoria</Label>
          <Select id="categoryId" name="categoryId" defaultValue={course?.categoryId ?? ""}>
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={course?.status ?? "DRAFT"}>
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="ARCHIVED">Arquivado</option>
          </Select>
        </div>
      </div>

      {state.error && (
        <p className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md border border-success/20 bg-success-soft px-3 py-2 text-sm text-success" role="status">
          {state.success}
        </p>
      )}

      <Button type="submit" loading={isPending}>
        {course ? "Salvar alterações" : "Criar curso e continuar"}
      </Button>
    </form>
  );
}
