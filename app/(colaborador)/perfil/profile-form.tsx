"use client";

import { useActionState } from "react";
import { updateOwnProfileAction } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/auth";
import { Label, FieldError, FieldHint } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function ProfileForm({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const [state, formAction, isPending] = useActionState(updateOwnProfileAction, initialState);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <div>
        <Label htmlFor="name">Nome completo</Label>
        <Input id="name" name="name" defaultValue={name} aria-invalid={!!state.fieldErrors?.name} required />
        <FieldError>{state.fieldErrors?.name?.[0]}</FieldError>
      </div>

      <div>
        <Label htmlFor="avatarUrl">URL da foto de perfil</Label>
        <Input id="avatarUrl" name="avatarUrl" defaultValue={avatarUrl ?? ""} placeholder="https://…" />
        <FieldHint>Opcional. Cole o link de uma imagem para usar como foto de perfil.</FieldHint>
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

      <Button type="submit" variant="secondary" loading={isPending}>
        Salvar alterações
      </Button>
    </form>
  );
}
