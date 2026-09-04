"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Upload, Trash2 } from "lucide-react";
import { updateOwnProfileAction } from "@/lib/actions/profile";
import type { ActionState } from "@/lib/actions/auth";
import { Label, FieldError, FieldHint } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";

const initialState: ActionState = {};
const ACCEPT = "image/png,image/jpeg,image/webp";

export function ProfileForm({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const [state, formAction, isPending] = useActionState(updateOwnProfileAction, initialState);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prévia local do arquivo escolhido (object URL) antes do envio.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Após salvar, a página revalida e reenvia `avatarUrl` — limpamos o estado local.
  useEffect(() => {
    if (!state.success) return;
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setRemoved(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [state.success]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
    if (file) setRemoved(false);
  }

  function handleRemove() {
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setRemoved(true);
    if (inputRef.current) inputRef.current.value = "";
  }

  const shownSrc = previewUrl ?? (removed ? null : avatarUrl);
  const hasPhoto = Boolean(shownSrc);

  return (
    <form action={formAction} encType="multipart/form-data" className="mt-4 space-y-4">
      <div>
        <Label htmlFor="name">Nome completo</Label>
        <Input id="name" name="name" defaultValue={name} aria-invalid={!!state.fieldErrors?.name} required />
        <FieldError>{state.fieldErrors?.name?.[0]}</FieldError>
      </div>

      <div>
        <Label>Foto de perfil</Label>
        <div className="mt-1 flex items-center gap-4">
          <Avatar name={name} src={shownSrc} size="lg" />

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-sm text-muted hover:border-border-strong hover:bg-surface">
              <Upload className="h-4 w-4" aria-hidden="true" />
              {hasPhoto ? "Trocar foto" : "Enviar foto"}
              <input
                ref={inputRef}
                type="file"
                name="avatar"
                accept={ACCEPT}
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>

            {hasPhoto && (
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted hover:border-danger/40 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remover
              </button>
            )}
          </div>
        </div>
        <input type="hidden" name="removeAvatar" value={removed ? "1" : ""} />
        <FieldHint>Opcional. PNG, JPG ou WebP, até 5 MB.</FieldHint>
        <FieldError>{state.fieldErrors?.avatar?.[0]}</FieldError>
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
