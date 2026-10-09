import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import {
  findNloginByUsername,
  findUserByNloginId,
  findUserByEmail,
  verifyPassword,
  updateNloginLastLogin,
  createUserWithProfile,
} from "@/lib/nlogin";

// Intervalo entre as revalidações do token contra o banco (role, conta ativa,
// sessionVersion). Uma senha trocada ou conta desativada derruba as sessões
// abertas em até 1 minuto.
const SESSION_RECHECK_MS = 60 * 1000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "nLogin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const identifier = (credentials?.username as string | undefined)?.trim();
        const password = credentials?.password as string | undefined;

        if (!identifier || !password || password.length > 128) return null;

        let nloginRecord;
        let userRecord;

        if (identifier.includes("@")) {
          userRecord = await findUserByEmail(identifier.toLowerCase());
          if (!userRecord) return null;
          nloginRecord = userRecord.nlogin;
        } else {
          nloginRecord = await findNloginByUsername(identifier);
          if (!nloginRecord) return null;
          userRecord = await findUserByNloginId(nloginRecord.id);
        }

        if (!nloginRecord?.password) return null;

        const valid = await verifyPassword(password, nloginRecord.password);
        if (!valid) return null;

        // Auto-criar User + Profile para jogadores do Minecraft no primeiro login
        if (!userRecord) {
          const email = nloginRecord.email || `${nloginRecord.last_name}@craftsapiens.temp`;
          userRecord = await createUserWithProfile(nloginRecord.id, email.toLowerCase());
        }

        // Conta desativada é reativada ao fazer login (docs/paginas/09-perfil.md)
        if (userRecord.deactivatedAt) {
          await prisma.user.update({
            where: { id: userRecord.id },
            data: { deactivatedAt: null },
          });
        }

        await updateNloginLastLogin(nloginRecord.id);

        return {
          id: userRecord.id,
          username: nloginRecord.last_name,
          email: userRecord.email,
          role: userRecord.role,
          nloginId: nloginRecord.id,
          sessionVersion: userRecord.sessionVersion,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  },
  pages: {
    signIn: "/login",
    newUser: "/registro",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.username = user.username;
        token.email = user.email!;
        token.role = user.role;
        token.nloginId = user.nloginId;
        token.sessionVersion = user.sessionVersion;
        token.checkedAt = Date.now();
        return token;
      }

      // Revalida periodicamente: sessão encerrada se a senha mudou, a conta foi
      // desativada/excluída ou o sessionVersion foi incrementado
      const checkedAt = typeof token.checkedAt === "number" ? token.checkedAt : 0;
      if (Date.now() - checkedAt > SESSION_RECHECK_MS) {
        const current = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, email: true, deactivatedAt: true, sessionVersion: true },
        });

        if (!current || current.deactivatedAt || current.sessionVersion !== token.sessionVersion) {
          return null;
        }

        token.role = current.role;
        token.email = current.email;
        token.checkedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.email = token.email as string;
      session.user.role = token.role as "ALUNO" | "PROFESSOR" | "MODERADOR" | "ADMIN";
      session.user.nloginId = token.nloginId as number;
      return session;
    },
  },
});
