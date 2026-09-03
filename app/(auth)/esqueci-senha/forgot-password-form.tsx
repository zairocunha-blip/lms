"use client";

import { useActionState } from "react";
import { requestPasswordResetAction, type ActionState } from "@/lib/actions/auth";
import { Label, FieldError } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(requestPasswordResetAction, initialState);

  if (state.success) {
    return (
      <p className="mt-6 rounded-md border border-success/20 bg-success-soft px-3 py-2.5 text-sm text-success">
        {state.success}
      </p>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          aria-invalid={!!state.fieldErrors?.email}
          required
        />
        <FieldError>{state.fieldErrors?.email?.[0]}</FieldError>
      </div>

      {state.error && (
        <p className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" loading={isPending}>
        Enviar link de redefinição
      </Button>
    </form>
  );
}
