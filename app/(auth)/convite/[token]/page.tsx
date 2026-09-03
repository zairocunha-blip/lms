import type { Metadata } from "next";
import Link from "next/link";
import { verifyPasswordToken } from "@/lib/auth/tokens";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export const metadata: Metadata = { title: "Bem-vindo(a)" };
export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await verifyPasswordToken(token);

  if (!result.valid) {
    return (
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Convite inválido</h1>
        <p className="mt-2 text-sm text-muted">
          {result.reason === "expired"
            ? "Este convite expirou."
            : result.reason === "used"
              ? "Este convite já foi utilizado — você já pode fazer login normalmente."
              : "Não foi possível validar este convite."}
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-ink">
        Bem-vindo(a), {result.token.user.name.split(" ")[0]}
      </h1>
      <p className="mt-1 text-sm text-muted">Sua conta foi criada. Defina uma senha para começar a acessar seus treinamentos.</p>
      <SetPasswordForm token={token} />
    </div>
  );
}
