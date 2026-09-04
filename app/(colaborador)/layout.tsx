import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { listNotifications, getUnreadCount } from "@/lib/services/notification";

export const dynamic = "force-dynamic";

export default async function CollaboratorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  // Regra — o administrador tem sua própria área (`/admin/*`) e não acessa as
  // telas do colaborador. O middleware já bloqueia por rota; esta é a segunda
  // camada de defesa (nunca confiar apenas na proteção de rota).
  if (session.user.role === "ADMIN") redirect("/admin/dashboard");

  const [notifications, unreadCount] = await Promise.all([
    listNotifications(session.user.id, 8),
    getUnreadCount(session.user.id),
  ]);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar userName={session.user.name ?? ""} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          userName={session.user.name ?? ""}
          userEmail={session.user.email ?? ""}
          avatarUrl={session.user.image}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="mx-auto max-w-content px-4 py-6 md:px-8 md:py-8">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
