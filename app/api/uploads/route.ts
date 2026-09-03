import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { requireAdmin } from "@/lib/auth/permissions";

const ALLOWED_KINDS = {
  image: { mimeTypes: ["image/png", "image/jpeg", "image/webp"], maxBytes: 5 * 1024 * 1024, ext: { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" } },
  pdf: { mimeTypes: ["application/pdf"], maxBytes: 25 * 1024 * 1024, ext: { "application/pdf": "pdf" } },
} as const;

/**
 * Upload local de arquivos (capas de curso e apresentações em PDF).
 * Somente administradores. Em produção, considere trocar por um bucket de
 * objetos (S3/R2/GCS) — a interface (retorna { url }) já foi pensada para
 * não exigir mudanças no restante do código quando isso acontecer.
 */
export async function POST(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Não autorizado." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const kindParam = String(formData.get("kind") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (kindParam !== "image" && kindParam !== "pdf") {
    return NextResponse.json({ error: "Tipo de upload inválido." }, { status: 400 });
  }

  const config = ALLOWED_KINDS[kindParam];
  if (!config.mimeTypes.includes(file.type as never)) {
    return NextResponse.json({ error: "Formato de arquivo não permitido." }, { status: 400 });
  }
  if (file.size > config.maxBytes) {
    return NextResponse.json({ error: "Arquivo excede o tamanho máximo permitido." }, { status: 400 });
  }

  const ext = (config.ext as Record<string, string>)[file.type];
  const fileName = `${nanoid(12)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", kindParam);
  await mkdir(uploadDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, fileName), buffer);

  return NextResponse.json({ url: `/uploads/${kindParam}/${fileName}`, fileName: file.name });
}
