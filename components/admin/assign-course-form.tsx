"use client";

import { useActionState, useState } from "react";
import { assignCourseAction } from "@/lib/actions/assignment";
import type { ActionState } from "@/lib/actions/auth";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const initialState: ActionState = {};

interface CourseOption {
  id: string;
  title: string;
}
interface UserOption {
  id: string;
  name: string;
}
interface DepartmentOption {
  id: string;
  name: string;
}

/**
 * Contexto "usuário": um curso é escolhido e atribuído a um colaborador fixo.
 * Contexto "curso": o curso é fixo e o administrador escolhe os destinatários
 * (colaboradores específicos, um ou mais departamentos, ou todos).
 */
export function AssignCourseForm({
  courses,
  fixedUserId,
  fixedCourseId,
  users,
  departments,
}: {
  courses?: CourseOption[];
  fixedUserId?: string;
  fixedCourseId?: string;
  users?: UserOption[];
  departments?: DepartmentOption[];
}) {
  const [state, formAction, isPending] = useActionState(assignCourseAction, initialState);
  const [mode, setMode] = useState<"users" | "departments" | "all">("users");

  return (
    <form action={formAction} className="space-y-4">
      {fixedUserId && <input type="hidden" name="userIds" value={fixedUserId} />}
      {fixedCourseId && <input type="hidden" name="courseId" value={fixedCourseId} />}

      {courses && (
        <div>
          <Label htmlFor="courseId">Curso</Label>
          <Select id="courseId" name="courseId" required>
            <option value="">Selecione um curso</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
        </div>
      )}

      {(users || departments) && (
        <div>
          <Label>Atribuir para</Label>
          <div className="flex flex-wrap gap-1.5">
            {users && (
              <ModeButton active={mode === "users"} onClick={() => setMode("users")}>
                Colaboradores
              </ModeButton>
            )}
            {departments && (
              <ModeButton active={mode === "departments"} onClick={() => setMode("departments")}>
                Departamento
              </ModeButton>
            )}
            <ModeButton active={mode === "all"} onClick={() => setMode("all")}>
              Todos
            </ModeButton>
          </div>

          {mode === "users" && users && (
            <select
              name="userIds"
              multiple
              size={Math.min(6, Math.max(3, users.length))}
              className="mt-2 w-full rounded-md border border-border bg-canvas p-2 text-sm"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}

          {mode === "departments" && departments && (
            <select
              name="departmentIds"
              multiple
              size={Math.min(6, Math.max(3, departments.length))}
              className="mt-2 w-full rounded-md border border-border bg-canvas p-2 text-sm"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {mode === "all" && (
            <>
              <input type="hidden" name="assignToAll" value="on" />
              <p className="mt-2 text-sm text-muted">O curso será atribuído a todos os colaboradores ativos.</p>
            </>
          )}
        </div>
      )}

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

      <Button type="submit" loading={isPending} size="sm">
        Atribuir
      </Button>
    </form>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary-soft text-primary-strong" : "border-border text-muted hover:bg-surface-alt"
      )}
    >
      {children}
    </button>
  );
}
