import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { Header } from "@/components/layout/header";
import { listNotifications, getUnreadCount } from "@/lib/services/notification";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Regra 1 — colaborador nunca pode acessar endpoints/telas administrativas.
  // O middleware já bloqueia por rota; esta checagem é a segunda camada de
  // defesa exigida (nunca confiar apenas na proteção de rota).
  if (session.user.role !== "ADMIN") redirect("/home");

  const [notifications, unreadCount] = await Promise.all([
    listNotifications(session.user.id, 8),
    getUnreadCount(session.user.id),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <AdminSidebar userName={session.user.name ?? ""} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          userName={session.user.name ?? ""}
          userEmail={session.user.email ?? ""}
          avatarUrl={session.user.image}
          isAdmin
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-content px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
