"use client";

import Link from "next/link";
import { Bell, LogOut, User as UserIcon, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatRelative } from "@/lib/utils/format";
import { signOutAction } from "@/lib/actions/auth";
import { markNotificationsReadAction } from "@/lib/actions/notification";

interface HeaderNotification {
  id: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

export function Header({
  userName,
  userEmail,
  avatarUrl,
  isAdmin,
  notifications,
  unreadCount,
}: {
  userName: string;
  userEmail: string;
  avatarUrl?: string | null;
  isAdmin?: boolean;
  notifications: HeaderNotification[];
  unreadCount: number;
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-canvas px-4 md:px-6">
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Badge tone="primary" className="hidden sm:inline-flex">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Administração
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <DropdownMenu onOpenChange={(open) => open && unreadCount > 0 && markNotificationsReadAction()}>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-surface-alt hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label={`Notificações${unreadCount > 0 ? ` (${unreadCount} não lidas)` : ""}`}
            >
              <Bell className="h-[18px] w-[18px]" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80">
            <div className="px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-muted">Notificações</div>
            {notifications.length === 0 ? (
              <p className="px-2.5 py-3 text-sm text-muted">Nenhuma notificação por aqui ainda.</p>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="rounded px-2.5 py-2 text-sm hover:bg-surface-alt">
                    <p className={n.isRead ? "text-ink-soft" : "font-medium text-ink"}>{n.message}</p>
                    <p className="mt-0.5 text-xs text-muted-subtle">{formatRelative(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-surface-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              <Avatar name={userName} src={avatarUrl} size="sm" />
              <span className="hidden text-sm font-medium text-ink sm:inline">{userName.split(" ")[0]}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-medium text-ink">{userName}</p>
              <p className="truncate text-xs text-muted-subtle">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/perfil" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" aria-hidden="true" />
                Meu perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <form action={signOutAction}>
              <DropdownMenuItem asChild destructive>
                <button type="submit" className="flex w-full items-center gap-2 text-left">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Sair
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
