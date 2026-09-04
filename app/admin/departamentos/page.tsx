import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { listDepartments } from "@/lib/services/department";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { DepartmentForm } from "./department-form";
import { DepartmentRow } from "./department-row";

export const metadata: Metadata = { title: "Departamentos" };
export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const departments = await listDepartments();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Departamentos</h1>
      <p className="mt-1 text-muted">
        Áreas da empresa usadas para classificar colaboradores e direcionar cursos.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent>
            <p className="font-display text-sm font-semibold text-ink">Novo departamento</p>
            <DepartmentForm />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent>
            {departments.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="Nenhum departamento cadastrado"
                description="Crie o primeiro departamento ao lado."
              />
            ) : (
              <ul className="divide-y divide-border">
                {departments.map((department) => (
                  <DepartmentRow
                    key={department.id}
                    id={department.id}
                    name={department.name}
                    userCount={department._count.users}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
