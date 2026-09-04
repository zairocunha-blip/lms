import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { getEmployeeDashboardStats } from "@/lib/services/stats";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDate } from "@/lib/utils/format";
import { PlayCircle, CheckCircle2, TrendingUp, KeyRound } from "lucide-react";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Perfil" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  const [user, stats] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: session!.user.id },
      include: { department: true, role: true },
    }),
    getEmployeeDashboardStats(session!.user.id),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Perfil</h1>
      <p className="mt-1 text-muted">Suas informações e seu progresso na plataforma.</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar name={user.name} src={user.avatarUrl} size="lg" />
                <div>
                  <p className="font-display text-lg font-semibold text-ink">{user.name}</p>
                  <p className="text-sm text-muted">{user.jobTitle ?? "Cargo não informado"}</p>
                </div>
              </div>

              <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoField label="E-mail" value={user.email} />
                <InfoField label="Departamento" value={user.department?.name ?? "—"} />
                <InfoField label="Cargo" value={user.jobTitle ?? "—"} />
                <InfoField label="Data de entrada" value={formatDate(user.hiredAt)} />
              </dl>

              <p className="mt-5 text-xs text-muted-subtle">
                E-mail, cargo e departamento são gerenciados pela administração. Para atualizar essas
                informações, entre em contato com o RH.
              </p>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardContent>
              <p className="font-display text-sm font-semibold text-ink">Editar informações</p>
              <ProfileForm name={user.name} avatarUrl={user.avatarUrl} />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardContent>
              <p className="font-display text-sm font-semibold text-ink">Segurança</p>
              <p className="mt-1 text-sm text-muted">
                Troque sua senha quando quiser. Após a troca, você entra novamente com a nova senha.
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

        <div className="space-y-3">
          <StatCard label="Em andamento" value={stats.inProgress} icon={PlayCircle} tone="primary" />
          <StatCard label="Concluídos" value={stats.completed} icon={CheckCircle2} tone="success" />
          <StatCard label="Progresso geral" value={`${stats.averageCompletion}%`} icon={TrendingUp} tone="warning" />
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-subtle">{label}</dt>
      <dd className="mt-1 text-sm text-ink-soft">{value}</dd>
    </div>
  );
}
