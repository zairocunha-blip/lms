import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search, BookOpen } from "lucide-react";
import { listCourses, listCategories } from "@/lib/services/course";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { CourseStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationLinks } from "@/components/admin/pagination-links";
import { formatDate } from "@/lib/utils/format";
import { CourseRowActions } from "./course-row-actions";

export const metadata: Metadata = { title: "Cursos" };
export const dynamic = "force-dynamic";

interface SearchParams {
  [key: string]: string | undefined;
  search?: string;
  categoryId?: string;
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  page?: string;
}

export default async function AdminCoursesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [{ courses, total, totalPages }, categories] = await Promise.all([
    listCourses({ search: params.search, categoryId: params.categoryId, status: params.status, page }),
    listCategories(),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Cursos</h1>
          <p className="mt-1 text-muted">{total} cursos cadastrados.</p>
        </div>
        <Button asChild>
          <Link href="/admin/cursos/novo">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo curso
          </Link>
        </Button>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3 rounded-md border border-border bg-canvas p-4">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="search" className="mb-1.5 block text-sm font-medium text-ink-soft">
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input id="search" name="search" defaultValue={params.search} placeholder="Nome do curso" className="pl-9" />
          </div>
        </div>

        <div className="w-48">
          <label htmlFor="categoryId" className="mb-1.5 block text-sm font-medium text-ink-soft">
            Categoria
          </label>
          <Select id="categoryId" name="categoryId" defaultValue={params.categoryId ?? ""}>
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-40">
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-ink-soft">
            Status
          </label>
          <Select id="status" name="status" defaultValue={params.status ?? ""}>
            <option value="">Todos</option>
            <option value="DRAFT">Rascunho</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="ARCHIVED">Arquivado</option>
          </Select>
        </div>

        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {courses.length === 0 ? (
        <EmptyState className="mt-6" icon={BookOpen} title="Nenhum curso encontrado" description="Ajuste os filtros ou crie um novo curso." />
      ) : (
        <div className="mt-6 rounded-md border border-border bg-canvas px-1">
          <Table>
            <Thead>
              <tr>
                <Th>Curso</Th>
                <Th>Categoria</Th>
                <Th>Status</Th>
                <Th>Módulos</Th>
                <Th>Aulas</Th>
                <Th>Colaboradores</Th>
                <Th>Criado em</Th>
                <Th />
              </tr>
            </Thead>
            <Tbody>
              {courses.map((course) => {
                const lessonCount = course.modules.reduce((sum, m) => sum + m._count.lessons, 0);
                return (
                  <Tr key={course.id}>
                    <Td>
                      <Link href={`/admin/cursos/${course.id}/editar`} className="font-medium text-ink hover:text-primary">
                        {course.title}
                      </Link>
                    </Td>
                    <Td>{course.category?.name ?? "—"}</Td>
                    <Td>
                      <CourseStatusBadge status={course.status} />
                    </Td>
                    <Td>{course.modules.length}</Td>
                    <Td>{lessonCount}</Td>
                    <Td>{course._count.assignments}</Td>
                    <Td>{formatDate(course.createdAt)}</Td>
                    <Td>
                      <CourseRowActions courseId={course.id} status={course.status} />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
          <div className="px-4 pb-4">
            <PaginationLinks page={page} totalPages={totalPages} searchParams={params} />
          </div>
        </div>
      )}
    </div>
  );
}
