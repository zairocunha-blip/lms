import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ProfileForm } from "@/app/(colaborador)/perfil/profile-form";

export const metadata: Metadata = { title: "Meu perfil" };
export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const session = await auth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session!.user.id },
    include: { role: true },
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Meu perfil</h1>
      <p className="mt-1 text-muted">Seus dados de acesso à plataforma.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar name={user.name} src={user.avatarUrl} size="lg" />
              <div>
                <p className="font-display text-lg font-semibold text-ink">{user.name}</p>
                <p className="text-sm text-muted">{user.email}</p>
              </div>
            </div>
            <ProfileForm name={user.name} avatarUrl={user.avatarUrl} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted">
              Troque sua senha periodicamente. Após a troca, você precisará entrar novamente.
            </p>
            <Link
              href="/trocar-senha"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Trocar minha senha
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
