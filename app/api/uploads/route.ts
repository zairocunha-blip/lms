import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/permissions";
import { saveUpload, UploadError } from "@/lib/uploads";

/**
 * Upload local de arquivos usado pelo painel administrativo (capas de curso e
 * apresentações em PDF). O upload de foto de perfil do próprio colaborador é
 * tratado direto na Server Action `updateOwnProfileAction`.
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

  try {
    const { url, fileName } = await saveUpload(file, kindParam);
    return NextResponse.json({ url, fileName });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
