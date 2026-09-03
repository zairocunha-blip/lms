import "server-only";
import { prisma } from "@/lib/db/prisma";

export async function getAdminDashboardStats() {
  const [totalEmployees, totalCourses, activeCourses, assignmentCounts, avgProgress] = await Promise.all([
    prisma.user.count({ where: { role: { code: "EMPLOYEE" } } }),
    prisma.course.count(),
    prisma.course.count({ where: { status: "PUBLISHED" } }),
    prisma.courseAssignment.groupBy({ by: ["status"], _count: true }),
    prisma.courseProgress.aggregate({ _avg: { percentage: true } }),
  ]);

  const byStatus = Object.fromEntries(assignmentCounts.map((c) => [c.status, c._count]));

  return {
    totalEmployees,
    totalCourses,
    activeCourses,
    completed: byStatus.COMPLETED ?? 0,
    inProgress: byStatus.IN_PROGRESS ?? 0,
    notStarted: byStatus.NOT_STARTED ?? 0,
    averageCompletion: Math.round(avgProgress._avg.percentage ?? 0),
  };
}

/** Conclusões por mês (últimos 6 meses) para o gráfico do dashboard administrativo. */
export async function getCompletionsByMonth() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const completions = await prisma.courseAssignment.findMany({
    where: { status: "COMPLETED", completedAt: { gte: sixMonthsAgo } },
    select: { completedAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = new Date(sixMonthsAgo);
    d.setMonth(d.getMonth() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
  }

  for (const c of completions) {
    if (!c.completedAt) continue;
    const key = `${c.completedAt.getFullYear()}-${String(c.completedAt.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return Array.from(buckets.entries()).map(([key, value]) => {
    const [, month] = key.split("-");
    const monthLabel = monthNames[Number(month) - 1] ?? month ?? "—";
    return { month: monthLabel, total: value };
  });
}

export async function getEmployeeDashboardStats(userId: string) {
  const assignments = await prisma.courseAssignment.findMany({
    where: { userId },
  });

  const inProgress = assignments.filter((a) => a.status === "IN_PROGRESS").length;
  const completed = assignments.filter((a) => a.status === "COMPLETED").length;
  const notStarted = assignments.filter((a) => a.status === "NOT_STARTED").length;

  const progresses = await prisma.courseProgress.findMany({ where: { userId } });
  const average =
    progresses.length === 0
      ? 0
      : Math.round(progresses.reduce((sum, p) => sum + p.percentage, 0) / progresses.length);

  return { inProgress, completed, notStarted, averageCompletion: average, totalAssigned: assignments.length };
}
