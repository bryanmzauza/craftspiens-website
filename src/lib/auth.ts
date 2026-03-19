import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "nLogin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        // TODO: Implementar validação contra tabela nLogin (bcrypt)
        // 1. Buscar usuário na tabela nlogin por last_name
        // 2. Comparar hash bcrypt da senha
        // 3. Retornar user se válido
        if (!credentials?.username || !credentials?.password) {
          return null;
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    newUser: "/registro",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
