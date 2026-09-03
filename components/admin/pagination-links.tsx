import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function PaginationLinks({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  function buildHref(targetPage: number) {
    const query = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && key !== "page") query.set(key, value);
    });
    if (targetPage > 1) query.set("page", String(targetPage));
    const qs = query.toString();
    return qs ? `?${qs}` : "?";
  }

  return (
    <div className="flex items-center justify-between border-t border-border pt-3">
      <p className="text-sm text-muted">
        Página {page} de {totalPages}
      </p>
      <div className="flex gap-2">
        <PageLink href={buildHref(page - 1)} disabled={page <= 1}>
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </PageLink>
        <PageLink href={buildHref(page + 1)} disabled={page >= totalPages}>
          Próxima
          <ChevronRight className="h-4 w-4" />
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled?: boolean; children: React.ReactNode }) {
  if (disabled) {
    return (
      <span className="flex cursor-not-allowed items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-subtle opacity-50">
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-ink-soft hover:border-border-strong hover:bg-surface"
      )}
    >
      {children}
    </Link>
  );
}
