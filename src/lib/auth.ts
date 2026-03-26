import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import {
  findNloginByUsername,
  findUserByNloginId,
  findUserByEmail,
  verifyPassword,
  updateNloginLastLogin,
  createUserWithProfile,
} from "@/lib/nlogin";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "nLogin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const identifier = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!identifier || !password) return null;

        let nloginRecord;
        let userRecord;

        if (identifier.includes("@")) {
          userRecord = await findUserByEmail(identifier);
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
          userRecord = await createUserWithProfile(nloginRecord.id, email);
        }

        await updateNloginLastLogin(nloginRecord.id);

        return {
          id: userRecord.id,
          username: nloginRecord.last_name,
          email: userRecord.email,
          role: userRecord.role,
          nloginId: nloginRecord.id,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
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
