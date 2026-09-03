"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Tag,
  LineChart,
  LogOut,
  GraduationCap,
  ArrowLeftRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { signOutAction } from "@/lib/actions/auth";

const links: { href: string; icon: LucideIcon; label: string; exact?: boolean }[] = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/admin/usuarios", icon: Users, label: "Usuários" },
  { href: "/admin/cursos", icon: BookOpen, label: "Cursos" },
  { href: "/admin/categorias", icon: Tag, label: "Categorias" },
  { href: "/admin/progresso", icon: LineChart, label: "Progresso" },
];

export function AdminSidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-black/20 bg-ink md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold text-white">Treinamentos</p>
          <p className="text-[11px] text-white/50">Administração</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4" aria-label="Navegação administrativa">
        {links.map(({ href, icon: Icon, label, exact }) => {
          const isActive = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-white/10 p-3">
        <Link
          href="/home"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeftRight className="h-[18px] w-[18px]" aria-hidden="true" />
          Área do colaborador
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            Sair
          </button>
        </form>
        <p className="mt-2 truncate px-3 text-xs text-white/30" title={userName}>
          {userName}
        </p>
      </div>
    </aside>
  );
}
