import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getUserDetail } from "@/lib/services/user";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UserForm } from "../user-form";
import { AssignCourseForm } from "@/components/admin/assign-course-form";
import { AssignedCoursesList } from "@/components/admin/assigned-courses-list";

export const metadata: Metadata = { title: "Editar usuário" };
export const dynamic = "force-dynamic";

export default async function EditUserPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const [user, departments, courses] = await Promise.all([
    getUserDetail(userId),
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.course.findMany({ where: { status: "PUBLISHED" }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  if (!user) notFound();

  return (
    <div>
      <Link href="/admin/usuarios" className="flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Usuários
      </Link>

      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{user.name}</h1>
      <p className="mt-1 text-muted">{user.email}</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Dados cadastrais</CardTitle>
          </CardHeader>
          <CardContent>
            <UserForm
              departments={departments}
              user={{
                id: user.id,
                name: user.name,
                email: user.email,
                jobTitle: user.jobTitle,
                departmentId: user.departmentId,
                roleCode: user.role.code,
                status: user.status,
                hiredAt: user.hiredAt ? user.hiredAt.toISOString().slice(0, 10) : null,
              }}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Atribuir curso</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignCourseForm courses={courses} fixedUserId={user.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cursos atribuídos</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignedCoursesList assignments={user.assignments} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
