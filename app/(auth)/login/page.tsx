import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ "senha-alterada"?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    if (session.user.mustChangePassword) redirect("/trocar-senha");
    redirect(session.user.role === "ADMIN" ? "/admin/dashboard" : "/home");
  }

  const params = await searchParams;

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-ink">Entrar</h1>
      <p className="mt-1 text-sm text-muted">Acesse sua conta para continuar seus treinamentos.</p>

      {params["senha-alterada"] && (
        <p className="mt-4 rounded-md border border-success/20 bg-success-soft px-3 py-2 text-sm text-success">
          Senha alterada com sucesso. Entre com a nova senha.
        </p>
      )}

      <LoginForm />

      <p className="mt-5 text-center text-xs text-muted">
        Esqueceu sua senha? Solicite ao administrador da plataforma — ele redefine seu acesso para a senha
        padrão, que você troca no login seguinte.
      </p>
    </div>
  );
}
