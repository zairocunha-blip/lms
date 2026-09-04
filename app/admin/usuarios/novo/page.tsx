import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { DEFAULT_PASSWORD } from "@/lib/auth/default-password";
import { UserForm } from "../user-form";

export const metadata: Metadata = { title: "Novo usuário" };
export const dynamic = "force-dynamic";

export default async function NewUserPage() {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <Link href="/admin/usuarios" className="flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Usuários
      </Link>

      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Novo usuário</h1>
      <p className="mt-1 text-muted">
        O usuário é criado já ativo, com a senha padrão <strong className="font-medium text-ink">{DEFAULT_PASSWORD}</strong>.
        Informe essa senha a ele — a troca é obrigatória no primeiro acesso.
      </p>

      <Card className="mt-6 max-w-2xl">
        <CardContent>
          <UserForm departments={departments} />
        </CardContent>
      </Card>
    </div>
  );
}
