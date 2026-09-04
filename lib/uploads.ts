import "server-only";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

/**
 * Persistência local de arquivos enviados (capas de curso, apresentações em
 * PDF e fotos de perfil). Em produção, considere trocar por um bucket de
 * objetos (S3/R2/GCS) — a assinatura (`{ url }`) já foi pensada para não
 * exigir mudanças no restante do código quando isso acontecer.
 */

const IMAGE_RULES = {
  mimeTypes: ["image/png", "image/jpeg", "image/webp"],
  maxBytes: 5 * 1024 * 1024,
  ext: { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } as Record<string, string>,
};

export const UPLOAD_KINDS = {
  image: IMAGE_RULES,
  avatar: IMAGE_RULES,
  pdf: {
    mimeTypes: ["application/pdf"],
    maxBytes: 25 * 1024 * 1024,
    ext: { "application/pdf": "pdf" } as Record<string, string>,
  },
} as const;

export type UploadKind = keyof typeof UPLOAD_KINDS;

/** Erro de validação de upload — a `message` é segura para exibir ao usuário. */
export class UploadError extends Error {}

interface SavedUpload {
  url: string;
  fileName: string;
}

/**
 * Valida o tipo/tamanho de `file` contra as regras de `kind` e grava o
 * conteúdo em `public/uploads/<kind>/`. Lança `UploadError` quando o arquivo
 * não passa na validação.
 */
export async function saveUpload(file: File, kind: UploadKind): Promise<SavedUpload> {
  const rules = UPLOAD_KINDS[kind];

  if (!(rules.mimeTypes as readonly string[]).includes(file.type)) {
    throw new UploadError("Formato de arquivo não permitido.");
  }
  if (file.size > rules.maxBytes) {
    throw new UploadError("Arquivo excede o tamanho máximo permitido.");
  }

  const ext = rules.ext[file.type];
  const storedName = `${nanoid(12)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", kind);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, storedName), buffer);

  return { url: `/uploads/${kind}/${storedName}`, fileName: file.name };
}

/**
 * Remove, em melhor esforço, um arquivo previamente salvo por `saveUpload`.
 * Só age sobre caminhos relativos dentro de `/uploads/` — URLs externas ou
 * qualquer coisa fora dessa pasta são ignoradas. Falhas são silenciosas: um
 * arquivo órfão não deve impedir a operação principal (troca de foto etc.).
 */
export async function deleteLocalUpload(url: string | null | undefined): Promise<void> {
  if (!url || !url.startsWith("/uploads/")) return;

  const relative = url.replace(/^\/+/, "");
  const target = path.join(process.cwd(), "public", relative);
  const uploadsRoot = path.join(process.cwd(), "public", "uploads");
  if (!target.startsWith(uploadsRoot + path.sep)) return;

  try {
    await unlink(target);
  } catch {
    // Arquivo já removido ou inexistente — nada a fazer.
  }
}
