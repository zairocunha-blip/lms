import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Ignora assets estáticos, o ícone do site e a rota interna do NextAuth
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|icon.svg|uploads).*)"],
};
