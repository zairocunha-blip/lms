import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "ADMIN" | "EMPLOYEE";
    status?: "ACTIVE" | "INACTIVE" | "PENDING";
  }

  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "EMPLOYEE";
      status: "ACTIVE" | "INACTIVE" | "PENDING";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "EMPLOYEE";
    status: "ACTIVE" | "INACTIVE" | "PENDING";
  }
}
