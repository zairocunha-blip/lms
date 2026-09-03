import type { Metadata } from "next";
import Link from "next/link";
import { verifyPasswordToken } from "@/lib/auth/tokens";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export const metadata: Metadata = { title: "Redefinir senha" };
export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await verifyPasswordToken(token);

  if (!result.valid) {
    return (
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Link inválido</h1>
        <p className="mt-2 text-sm text-muted">
          {result.reason === "expired"
            ? "Este link de redefinição expirou."
            : result.reason === "used"
              ? "Este link já foi utilizado."
              : "Não foi possível validar este link."}{" "}
          Solicite um novo link para continuar.
        </p>
        <Link href="/esqueci-senha" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
          Solicitar novo link
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-ink">Redefinir senha</h1>
      <p className="mt-1 text-sm text-muted">Olá, {result.token.user.name.split(" ")[0]}. Defina sua nova senha abaixo.</p>
      <SetPasswordForm token={token} />
    </div>
  );
}
