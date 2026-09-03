"use client";

import Link from "next/link";
import { Home, BookOpen, History, User, LogOut, GraduationCap } from "lucide-react";
import { NavLink } from "@/components/layout/nav-link";
import { signOutAction } from "@/lib/actions/auth";

export function Sidebar({ userName }: { userName: string }) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-canvas md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-white">
          <GraduationCap className="h-4 w-4" aria-hidden="true" />
        </div>
        <span className="font-display text-sm font-semibold text-ink">Treinamentos</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4" aria-label="Navegação principal">
        <NavLink href="/home" icon={Home} exact>
          Home
        </NavLink>
        <NavLink href="/cursos" icon={BookOpen}>
          Meus cursos
        </NavLink>
        <NavLink href="/historico" icon={History}>
          Histórico
        </NavLink>
        <NavLink href="/perfil" icon={User}>
          Perfil
        </NavLink>
      </nav>

      <div className="border-t border-border p-3">
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-alt hover:text-ink"
          >
            <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
            Sair
          </button>
        </form>
        <p className="mt-2 truncate px-3 text-xs text-muted-subtle" title={userName}>
          {userName}
        </p>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-canvas py-1.5 md:hidden"
      aria-label="Navegação principal"
    >
      <MobileNavItem href="/home" icon={Home} label="Home" />
      <MobileNavItem href="/cursos" icon={BookOpen} label="Cursos" />
      <MobileNavItem href="/historico" icon={History} label="Histórico" />
      <MobileNavItem href="/perfil" icon={User} label="Perfil" />
    </nav>
  );
}

function MobileNavItem({ href, icon: Icon, label }: { href: string; icon: typeof Home; label: string }) {
  return (
    <Link href={href} className="flex flex-col items-center gap-0.5 px-3 py-1.5 text-muted">
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );
}
