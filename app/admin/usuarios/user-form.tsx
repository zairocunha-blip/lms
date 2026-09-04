"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserAction, updateUserAction } from "@/lib/actions/user";
import type { ActionState } from "@/lib/actions/auth";
import { Label, FieldError } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

interface Department {
  id: string;
  name: string;
}

interface ExistingUser {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  departmentId: string | null;
  roleCode: "ADMIN" | "EMPLOYEE";
  status: "ACTIVE" | "INACTIVE" | "PENDING";
  hiredAt: string | null;
}

export function UserForm({ departments, user }: { departments: Department[]; user?: ExistingUser }) {
  const router = useRouter();
  const action = user ? updateUserAction : createUserAction;
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {user && <input type="hidden" name="id" value={user.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" name="name" defaultValue={user?.name} aria-invalid={!!state.fieldErrors?.name} required />
          <FieldError>{state.fieldErrors?.name?.[0]}</FieldError>
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" defaultValue={user?.email} aria-invalid={!!state.fieldErrors?.email} required />
          <FieldError>{state.fieldErrors?.email?.[0]}</FieldError>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="jobTitle">Cargo</Label>
          <Input id="jobTitle" name="jobTitle" defaultValue={user?.jobTitle ?? ""} />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="departmentId">Departamento</Label>
            <Link href="/admin/departamentos" className="text-xs font-medium text-primary hover:underline">
              Gerenciar
            </Link>
          </div>
          <Select id="departmentId" name="departmentId" defaultValue={user?.departmentId ?? ""}>
            <option value="">Sem departamento</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="roleCode">Perfil de acesso</Label>
          <Select id="roleCode" name="roleCode" defaultValue={user?.roleCode ?? "EMPLOYEE"}>
            <option value="EMPLOYEE">Colaborador</option>
            <option value="ADMIN">Administrador</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="hiredAt">Data de entrada</Label>
          <Input id="hiredAt" name="hiredAt" type="date" defaultValue={user?.hiredAt ?? ""} />
        </div>
      </div>

      {user && (
        <div className="sm:w-1/2 sm:pr-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={user.status}>
            <option value="ACTIVE">Ativo</option>
            <option value="INACTIVE">Inativo</option>
            <option value="PENDING">Pendente</option>
          </Select>
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

      <div className="flex gap-3 pt-2">
        <Button type="submit" loading={isPending}>
          {user ? "Salvar alterações" : "Criar usuário"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/usuarios")}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
