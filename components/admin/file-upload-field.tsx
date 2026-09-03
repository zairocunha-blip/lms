"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, FileCheck2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function FileUploadField({
  name,
  fileNameFieldName,
  kind,
  defaultValue,
  defaultFileName,
  accept,
  label,
}: {
  name: string;
  fileNameFieldName?: string;
  kind: "image" | "pdf";
  defaultValue?: string;
  defaultFileName?: string;
  accept: string;
  label: string;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [fileName, setFileName] = useState(defaultFileName ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    try {
      const res = await fetch("/api/uploads", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha no upload.");
      setUrl(data.url);
      setFileName(data.fileName ?? file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      {fileNameFieldName && <input type="hidden" name={fileNameFieldName} value={fileName} />}

      {url ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm">
          <span className="flex items-center gap-2 truncate text-ink-soft">
            <FileCheck2 className="h-4 w-4 shrink-0 text-success" aria-hidden="true" />
            <span className="truncate">{fileName || url}</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setUrl("");
              setFileName("");
            }}
            className="shrink-0 text-muted hover:text-danger"
            aria-label="Remover arquivo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted hover:border-border-strong hover:bg-surface">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Enviando…" : label}
          <input ref={inputRef} type="file" accept={accept} className="sr-only" onChange={handleFileChange} disabled={uploading} />
        </label>
      )}

      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}

      <div className="mt-2">
        <Input
          placeholder="Ou cole a URL de um arquivo já hospedado"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="text-xs"
        />
      </div>
    </div>
  );
}
