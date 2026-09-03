import type { Metadata } from "next";
import { Users, BookOpen, CheckCircle2, PlayCircle, Clock, TrendingUp } from "lucide-react";
import { getAdminDashboardStats, getCompletionsByMonth } from "@/lib/services/stats";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CompletionsChart } from "@/components/admin/completions-chart";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, completionsByMonth] = await Promise.all([getAdminDashboardStats(), getCompletionsByMonth()]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Dashboard</h1>
      <p className="mt-1 text-muted">Visão geral dos treinamentos da empresa.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Colaboradores" value={stats.totalEmployees} icon={Users} />
        <StatCard label="Cursos publicados" value={stats.activeCourses} icon={BookOpen} tone="primary" />
        <StatCard label="Concluídos" value={stats.completed} icon={CheckCircle2} tone="success" />
        <StatCard label="Em andamento" value={stats.inProgress} icon={PlayCircle} />
        <StatCard label="Pendentes" value={stats.notStarted} icon={Clock} tone="warning" />
        <StatCard label="Taxa média de conclusão" value={`${stats.averageCompletion}%`} icon={TrendingUp} tone="primary" />
        <StatCard label="Total de cursos" value={stats.totalCourses} icon={BookOpen} />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Cursos concluídos por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <CompletionsChart data={completionsByMonth} />
        </CardContent>
      </Card>
    </div>
  );
}
