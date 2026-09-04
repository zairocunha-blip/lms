import { NextResponse } from "next/server";
import type { NextAuthConfig } from "next-auth";

/**
 * Configuração "edge-safe": não importa Prisma nem bcrypt aqui, pois este
 * arquivo é consumido pelo middleware (Edge Runtime). A validação de
 * credenciais real acontece em `auth.ts`, que roda em Node.js.
 */
const CHANGE_PASSWORD_PATH = "/trocar-senha";

// Telas do colaborador — o administrador é redirecionado para o seu painel.
const EMPLOYEE_ROOTS = ["/home", "/cursos", "/historico", "/perfil"];

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.status = (user as { status?: string }).status;
        token.mustChangePassword = (user as { mustChangePassword?: boolean }).mustChangePassword ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "EMPLOYEE";
        session.user.status = token.status as "ACTIVE" | "INACTIVE" | "PENDING";
        session.user.mustChangePassword = token.mustChangePassword === true;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isActive = auth?.user?.status === "ACTIVE";
      const { pathname } = request.nextUrl;

      // O login é a única rota pública: não há mais convite por e-mail nem
      // link de redefinição — o acesso inicial usa a senha padrão.
      const isPublicRoute = pathname.startsWith("/login");

      if (!isLoggedIn || !isActive) return isPublicRoute;

      // Enquanto a senha padrão não for trocada, todo o restante do sistema
      // fica bloqueado — inclusive as telas de administração.
      if (auth?.user?.mustChangePassword && pathname !== CHANGE_PASSWORD_PATH) {
        return NextResponse.redirect(new URL(CHANGE_PASSWORD_PATH, request.nextUrl));
      }

      const isAdmin = auth?.user?.role === "ADMIN";

      if (pathname.startsWith("/admin") && !isAdmin) {
        return false;
      }

      // O administrador não acessa a área do colaborador — vai para o painel.
      const inEmployeeArea = EMPLOYEE_ROOTS.some(
        (root) => pathname === root || pathname.startsWith(`${root}/`)
      );
      if (inEmployeeArea && isAdmin) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.nextUrl));
      }

      return true;
    },
  },
  providers: [], // providers reais são adicionados em auth.ts
} satisfies NextAuthConfig;
