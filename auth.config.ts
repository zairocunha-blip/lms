import type { NextAuthConfig } from "next-auth";

/**
 * Configuração "edge-safe": não importa Prisma nem bcrypt aqui, pois este
 * arquivo é consumido pelo middleware (Edge Runtime). A validação de
 * credenciais real acontece em `auth.ts`, que roda em Node.js.
 */
export const authConfig = {
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
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ADMIN" | "EMPLOYEE";
        session.user.status = token.status as "ACTIVE" | "INACTIVE" | "PENDING";
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isActive = auth?.user?.status === "ACTIVE";
      const { pathname } = request.nextUrl;

      const isPublicRoute =
        pathname.startsWith("/login") ||
        pathname.startsWith("/esqueci-senha") ||
        pathname.startsWith("/redefinir-senha") ||
        pathname.startsWith("/convite");

      if (isPublicRoute) return true;
      if (!isLoggedIn || !isActive) return false;

      if (pathname.startsWith("/admin") && auth?.user?.role !== "ADMIN") {
        return false;
      }

      return true;
    },
  },
  providers: [], // providers reais são adicionados em auth.ts
} satisfies NextAuthConfig;
