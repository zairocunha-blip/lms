import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold text-ink">Esqueci minha senha</h1>
      <p className="mt-1 text-sm text-muted">
        Informe seu e-mail corporativo. Se ele estiver cadastrado, enviaremos um link para redefinir sua senha.
      </p>

      <ForgotPasswordForm />

      <div className="mt-5 text-center">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Voltar para o login
        </Link>
      </div>
    </div>
  );
}
