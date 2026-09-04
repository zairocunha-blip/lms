import type { Metadata } from "next";
import Link from "next/link";
import { PlayCircle, CheckCircle2, Clock, TrendingUp, ArrowRight, BookOpen } from "lucide-react";
import { auth } from "@/auth";
import { getEmployeeDashboardStats } from "@/lib/services/stats";
import { getMyCourses } from "@/lib/services/course";
import { StatCard } from "@/components/dashboard/stat-card";
import { ContinueLearningCard } from "@/components/courses/continue-learning-card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const userId = session!.user.id;
  const firstName = (session!.user.name ?? "").split(" ")[0];

  const [stats, myCourses] = await Promise.all([getEmployeeDashboardStats(userId), getMyCourses(userId)]);

  const inProgressCourses = myCourses.filter((c) => c.assignment.status === "IN_PROGRESS");

  return (
    <div className="mx-auto max-w-content px-4 py-6 md:px-8 md:py-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Olá, {firstName}!</h1>
        <p className="mt-1 text-muted">Continue seu aprendizado de onde parou.</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Em andamento" value={stats.inProgress} icon={PlayCircle} tone="primary" />
        <StatCard label="Concluídos" value={stats.completed} icon={CheckCircle2} tone="success" />
        <StatCard label="Pendentes" value={stats.notStarted} icon={Clock} />
        <StatCard label="Conclusão média" value={`${stats.averageCompletion}%`} icon={TrendingUp} tone="warning" />
      </div>

      <section className="mt-8">
        <h2 className="font-display text-base font-semibold text-ink">Continue estudando</h2>
        {inProgressCourses.length === 0 ? (
          <EmptyState
            className="mt-3"
            icon={PlayCircle}
            title="Nenhum curso em andamento"
            description="Assim que você iniciar um curso atribuído, ele aparecerá aqui para você continuar de onde parou."
          />
        ) : (
          <div className="mt-3 space-y-3">
            {inProgressCourses.map(({ course, progress, lastLessonTitle }) => (
              <ContinueLearningCard
                key={course.id}
                courseId={course.id}
                title={course.title}
                description={course.description}
                coverUrl={course.coverUrl}
                percentage={progress?.percentage ?? 0}
                lastLessonTitle={lastLessonTitle}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Meus cursos</h2>
          <Link href="/cursos" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Ver todos
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        {myCourses.length === 0 ? (
          <EmptyState
            className="mt-3"
            icon={BookOpen}
            title="Você ainda não possui cursos atribuídos"
            description="Assim que um administrador atribuir um treinamento a você, ele aparecerá aqui."
          />
        ) : (
          <div className="mt-3 divide-y divide-border rounded-md border border-border bg-canvas">
            {myCourses.slice(0, 5).map(({ course, progress, assignment }) => (
              <Link
                key={course.id}
                href={`/cursos/${course.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface/60"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{course.title}</p>
                  <p className="mt-0.5 text-xs text-muted-subtle">{course.category?.name ?? "Sem categoria"}</p>
                </div>
                <span className="shrink-0 text-sm font-medium text-muted">{progress?.percentage ?? 0}%</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
