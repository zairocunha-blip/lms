import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { getCourseForEditing, listCategories } from "@/lib/services/course";
import { prisma } from "@/lib/db/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CourseInfoForm } from "@/components/admin/course-info-form";
import { CourseBuilder } from "@/components/admin/course-builder";
import { AssignCourseForm } from "@/components/admin/assign-course-form";
import { CourseStatusBadge } from "@/components/ui/status-badge";

export const metadata: Metadata = { title: "Editar curso" };
export const dynamic = "force-dynamic";

export default async function EditCoursePage({ params }: { params: Promise<{ cursoId: string }> }) {
  const { cursoId } = await params;

  const [course, categories, departments, employees, assignmentCount] = await Promise.all([
    getCourseForEditing(cursoId),
    listCategories(),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { role: { code: "EMPLOYEE" }, status: "ACTIVE" }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.courseAssignment.count({ where: { courseId: cursoId } }),
  ]);

  if (!course) notFound();

  return (
    <div>
      <Link href="/admin/cursos" className="flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Cursos
      </Link>

      <div className="mt-2 flex items-center gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">{course.title}</h1>
        <CourseStatusBadge status={course.status} />
      </div>
      <p className="mt-1 text-muted">
        {course.modules.length} módulo(s) · {course.modules.reduce((sum, m) => sum + m.lessons.length, 0)} aula(s) ·{" "}
        {assignmentCount} colaborador(es) atribuído(s)
      </p>

      <div className="mt-6">
        <CourseBuilder courseId={cursoId} modules={course.modules} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados do curso</CardTitle>
          </CardHeader>
          <CardContent>
            <CourseInfoForm
              categories={categories}
              course={{
                id: course.id,
                title: course.title,
                description: course.description,
                coverUrl: course.coverUrl,
                categoryId: course.categoryId,
                status: course.status,
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atribuir a colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignCourseForm fixedCourseId={cursoId} users={employees} departments={departments} />
            <Link
              href={`/admin/progresso?courseId=${cursoId}`}
              className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Ver progresso deste curso
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
