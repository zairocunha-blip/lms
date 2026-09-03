"use client";

import { useActionState, useRef, useEffect } from "react";
import { createCategoryAction } from "@/lib/actions/course";
import type { ActionState } from "@/lib/actions/auth";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: ActionState = {};

export function CategoryForm() {
  const [state, formAction, isPending] = useActionState(createCategoryAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="mt-4 space-y-3">
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input id="name" name="name" placeholder="Ex.: Compliance" required />
      </div>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-success">{state.success}</p>}

      <Button type="submit" size="sm" loading={isPending}>
        Criar categoria
      </Button>
    </form>
  );
}
