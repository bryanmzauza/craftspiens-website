import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    username: string;
    email: string;
    role: "ALUNO" | "PROFESSOR" | "MODERADOR" | "ADMIN";
    nloginId: number;
    sessionVersion: number;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      role: "ALUNO" | "PROFESSOR" | "MODERADOR" | "ADMIN";
      nloginId: number;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    email: string;
    role: "ALUNO" | "PROFESSOR" | "MODERADOR" | "ADMIN";
    nloginId: number;
    sessionVersion: number;
    checkedAt?: number;
  }
}
