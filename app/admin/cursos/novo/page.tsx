import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { listCategories } from "@/lib/services/course";
import { Card, CardContent } from "@/components/ui/card";
import { CourseInfoForm } from "@/components/admin/course-info-form";

export const metadata: Metadata = { title: "Novo curso" };
export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
  const categories = await listCategories();

  return (
    <div>
      <Link href="/admin/cursos" className="flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Cursos
      </Link>

      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">Novo curso</h1>
      <p className="mt-1 text-muted">Depois de criar o curso, você poderá adicionar módulos e aulas.</p>

      <Card className="mt-6 max-w-2xl">
        <CardContent>
          <CourseInfoForm categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
