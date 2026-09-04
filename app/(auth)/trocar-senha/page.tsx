import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signOutAction } from "@/lib/actions/auth";
import { ChangePasswordForm } from "@/components/auth/change-password-form";

export const metadata: Metadata = { title: "Trocar senha" };
export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const isFirstAccess = session.user.mustChangePassword;

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-ink">
        {isFirstAccess ? `Olá, ${session.user.name?.split(" ")[0] ?? ""}` : "Trocar senha"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {isFirstAccess
          ? "Este é seu primeiro acesso. Por segurança, troque a senha padrão por uma senha pessoal antes de continuar."
          : "Defina uma nova senha para sua conta. Você precisará entrar novamente depois."}
      </p>

      <ChangePasswordForm
        firstAccess={isFirstAccess}
        submitLabel={isFirstAccess ? "Trocar senha e continuar" : "Salvar nova senha"}
      />

      <div className="mt-5 text-center">
        <form action={signOutAction}>
          <button type="submit" className="text-sm font-medium text-muted hover:text-ink hover:underline">
            Sair
          </button>
        </form>
      </div>
    </div>
  );
}
