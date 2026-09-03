import type { Metadata } from "next";
import { Tag } from "lucide-react";
import { listCategories } from "@/lib/services/course";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryForm } from "./category-form";
import { CategoryRow } from "./category-row";

export const metadata: Metadata = { title: "Categorias" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Categorias</h1>
      <p className="mt-1 text-muted">Organize os cursos por assunto (Integração, Segurança, Compliance…).</p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent>
            <p className="font-display text-sm font-semibold text-ink">Nova categoria</p>
            <CategoryForm />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent>
            {categories.length === 0 ? (
              <EmptyState icon={Tag} title="Nenhuma categoria cadastrada" description="Crie a primeira categoria ao lado." />
            ) : (
              <ul className="divide-y divide-border">
                {categories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    id={category.id}
                    name={category.name}
                    isActive={category.isActive}
                    courseCount={category._count.courses}
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
