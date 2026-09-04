import "server-only";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

/**
 * Persistência local de arquivos enviados (capas de curso, apresentações em
 * PDF e fotos de perfil). Em produção, considere trocar por um bucket de
 * objetos (S3/R2/GCS) — a assinatura (`{ url }`) já foi pensada para não
 * exigir mudanças no restante do código quando isso acontecer.
 *
 * O diretório físico é resolvido por `UPLOADS_DIR` (caminho absoluto),
 * caindo para `public/uploads` dentro do projeto quando a variável não está
 * definida. Isso importa em produção: se o app roda em mais de uma instância
 * (cluster do PM2, múltiplas réplicas de container) ou é reiniciado a partir
 * de um checkout novo sem volume persistente, cada instância só enxerga o
 * que está no SEU disco — um arquivo salvo por uma instância retorna 404
 * quando outra tenta servi-lo, ou some no próximo deploy.
 *
 * `UPLOADS_DIR` precisa apontar para dentro de `public/` (ex.: montar o
 * volume persistente em `public/uploads` diretamente, ou em outro ponto
 * dentro de `public/` e setar `UPLOADS_DIR` para lá) — o Next só serve como
 * arquivo estático o que está fisicamente em `public/`; um caminho fora
 * dali nunca seria alcançado pelas requisições a `/uploads/...` e o upload
 * pareceria "funcionar" mas o arquivo nunca carregaria. Por isso a função
 * abaixo recusa qualquer `UPLOADS_DIR` fora de `public/` já na primeira
 * chamada, em vez de falhar silenciosamente mais tarde.
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

let loggedUploadsRoot = false;

/** Raiz física onde os uploads são gravados/lidos — sempre dentro de `public/` para ser servida pelo Next. */
function resolveUploadsRoot(): string {
  const publicRoot = path.join(process.cwd(), "public");
  const root = process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.join(publicRoot, "uploads");

  if (root !== publicRoot && !root.startsWith(publicRoot + path.sep)) {
    throw new Error(
      `UPLOADS_DIR ("${root}") precisa estar dentro de "${publicRoot}" — fora dali o Next não consegue servir os arquivos como estáticos.`
    );
  }

  if (!loggedUploadsRoot) {
    loggedUploadsRoot = true;
    console.info(`[uploads] Diretório em uso: ${root}`);
  }

  return root;
}

/**
 * Valida o tipo/tamanho de `file` contra as regras de `kind` e grava o
 * conteúdo em `<UPLOADS_DIR ou public/uploads>/<kind>/`. Lança `UploadError`
 * quando o arquivo não passa na validação.
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
  const uploadDir = path.join(resolveUploadsRoot(), kind);
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

  const relative = url.replace(/^\/uploads\//, "");
  const uploadsRoot = resolveUploadsRoot();
  const target = path.join(uploadsRoot, relative);
  if (!target.startsWith(uploadsRoot + path.sep)) return;

  try {
    await unlink(target);
  } catch {
    // Arquivo já removido ou inexistente — nada a fazer.
  }
}
