"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, Check } from "lucide-react";
import { changePasswordAction, type ActionState } from "@/lib/actions/auth";
import { Label, FieldError } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const initialState: ActionState = {};

const rules = [
  { test: (v: string) => v.length >= 8, label: "Pelo menos 8 caracteres" },
  { test: (v: string) => /[A-Z]/.test(v), label: "Uma letra maiúscula" },
  { test: (v: string) => /[a-z]/.test(v), label: "Uma letra minúscula" },
  { test: (v: string) => /[0-9]/.test(v), label: "Um número" },
];

export function ChangePasswordForm({
  submitLabel = "Salvar nova senha",
  firstAccess = false,
}: {
  submitLabel?: string;
  /** No primeiro acesso não pedimos a senha atual — ela acabou de ser usada no login. */
  firstAccess?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(changePasswordAction, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="mt-6 space-y-4" noValidate>
      {!firstAccess && (
        <div>
          <Label htmlFor="currentPassword">Senha atual</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!state.fieldErrors?.currentPassword}
            required
          />
          <FieldError>{state.fieldErrors?.currentPassword?.[0]}</FieldError>
        </div>
      )}

      <div>
        <Label htmlFor="password">Nova senha</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!state.fieldErrors?.password}
            className="pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <ul className="mt-2 space-y-1">
          {rules.map((rule) => {
            const met = rule.test(password);
            return (
              <li key={rule.label} className={cn("flex items-center gap-1.5 text-xs", met ? "text-success" : "text-muted-subtle")}>
                <Check className={cn("h-3 w-3", met ? "opacity-100" : "opacity-30")} aria-hidden="true" />
                {rule.label}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          aria-invalid={!!state.fieldErrors?.confirmPassword}
          required
        />
        <FieldError>{state.fieldErrors?.confirmPassword?.[0]}</FieldError>
      </div>

      {state.error && (
        <p className="rounded-md border border-danger/20 bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" loading={isPending}>
        {submitLabel}
      </Button>
    </form>
  );
}
