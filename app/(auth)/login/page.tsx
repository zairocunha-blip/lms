import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ "senha-definida"?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect(session.user.role === "ADMIN" ? "/admin/dashboard" : "/home");

  const params = await searchParams;

  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-ink">Entrar</h1>
      <p className="mt-1 text-sm text-muted">Acesse sua conta para continuar seus treinamentos.</p>

      {params["senha-definida"] && (
        <p className="mt-4 rounded-md border border-success/20 bg-success-soft px-3 py-2 text-sm text-success">
          Senha definida com sucesso. Faça login para continuar.
        </p>
      )}

      <LoginForm />

      <div className="mt-5 text-center">
        <Link href="/esqueci-senha" className="text-sm font-medium text-primary hover:underline">
          Esqueci minha senha
        </Link>
      </div>
    </div>
  );
}
