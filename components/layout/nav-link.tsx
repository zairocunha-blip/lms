"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function NavLink({
  href,
  icon: Icon,
  children,
  exact,
}: {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive ? "bg-primary-soft text-primary-strong" : "text-muted hover:bg-surface-alt hover:text-ink"
      )}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      {children}
    </Link>
  );
}
