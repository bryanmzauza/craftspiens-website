import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { OAuthConfig } from "next-auth/providers";
import { prisma } from "@/lib/prisma";
import {
  findNloginByUsername,
  findUserByNloginId,
  findUserByEmail,
  verifyPassword,
  updateNloginLastLogin,
  createUserWithProfile,
  getNloginById,
} from "@/lib/nlogin";
import { resolveMinecraftIdentity, verifiedEmailFromIdToken, type MinecraftIdentity } from "@/lib/minecraft-auth";
import {
  handleGoogleSignIn,
  handleMicrosoftSignIn,
  resolveGoogleUser,
  resolveMicrosoftUser,
  type SessionIdentity,
} from "@/lib/external-login";
import { isPlaceholderEmail } from "@/lib/email-verification";

// Intervalo entre as revalidações do token contra o banco (role, conta ativa,
// sessionVersion). Uma senha trocada ou conta desativada derruba as sessões
// abertas em até 1 minuto.
const SESSION_RECHECK_MS = 60 * 1000;

// Conta Microsoft (Minecraft Java original e Bedrock). Contas pessoais apenas
// (tenant "consumers"), com o escopo do Xbox Live usado pelos launchers.
function MicrosoftMinecraft(): OAuthConfig<MinecraftIdentity & Record<string, unknown>> {
  return {
    id: "microsoft",
    name: "Microsoft",
    type: "oauth",
    clientId: process.env.AUTH_MICROSOFT_ID,
    clientSecret: process.env.AUTH_MICROSOFT_SECRET,
    issuer: "https://login.microsoftonline.com/9188040d-6c67-4c5b-b112-36a304b66dad/v2.0",
    authorization: {
      url: "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize",
      // openid e email: o e-mail verificado da conta Microsoft confirma o e-mail do site
      params: { scope: "openid email XboxLive.signin offline_access", prompt: "select_account" },
    },
    token: "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
    userinfo: {
      url: "https://api.minecraftservices.com/minecraft/profile",
      async request({ tokens }: { tokens: { access_token?: string; id_token?: string } }) {
        if (!tokens.access_token) throw new Error("Token da Microsoft ausente");
        return {
          ...(await resolveMinecraftIdentity(tokens.access_token)),
          microsoftEmail: verifiedEmailFromIdToken(tokens.id_token),
        };
      },
    },
    checks: ["pkce", "state"],
    client: { token_endpoint_auth_method: "client_secret_post" },
    // Os dados reais da sessão vêm do banco no callback jwt; aqui só a identificação
    profile(profile) {
      const name = profile.javaName ?? profile.gamertag;
      return {
        id: profile.xuid,
        name,
        username: name,
        email: "",
        role: "ALUNO",
        nloginId: null,
        sessionVersion: 0,
        emailConfirmed: false,
      };
    },
  };
}

const providers: NextAuthConfig["providers"] = [
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

      // Contas sem nick (criadas pelo Google) não têm senha do jogo
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
        emailConfirmed: !!userRecord.emailVerifiedAt && !isPlaceholderEmail(userRecord.email),
      };
    },
  }),
];

// Provedores externos só ficam ativos com as credenciais configuradas
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: { params: { prompt: "select_account" } },
    })
  );
}
if (process.env.AUTH_MICROSOFT_ID && process.env.AUTH_MICROSOFT_SECRET) {
  providers.push(MicrosoftMinecraft());
}

function applyIdentity(token: Record<string, unknown>, identity: SessionIdentity) {
  token.id = identity.id;
  token.username = identity.username;
  token.email = identity.email;
  token.role = identity.role;
  token.nloginId = identity.nloginId;
  token.sessionVersion = identity.sessionVersion;
  token.emailConfirmed = identity.emailConfirmed;
  token.checkedAt = Date.now();
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  },
  pages: {
    signIn: "/login",
    newUser: "/registro",
    error: "/login",
  },
  callbacks: {
    // Contas externas: cria ou vincula a conta do site antes de emitir a sessão.
    // Uma string devolvida aqui redireciona para a página com a mensagem de erro.
    async signIn({ account, profile }) {
      try {
        if (account?.provider === "google" && profile) {
          return await handleGoogleSignIn({
            sub: String(profile.sub),
            email: String(profile.email ?? ""),
            emailConfirmed: profile.email_verified === true,
            name: typeof profile.name === "string" ? profile.name : null,
          });
        }
        if (account?.provider === "microsoft" && profile) {
          return await handleMicrosoftSignIn(profile as unknown as MinecraftIdentity);
        }
        return true;
      } catch (error) {
        // Falha de infraestrutura (ex.: banco fora do ar): mensagem própria em vez de "acesso negado"
        console.error(`[auth] Erro no login por ${account?.provider}:`, error);
        return "/login?error=ServicoIndisponivel";
      }
    },

    async jwt({ token, user, account, profile, trigger }) {
      if (account?.provider === "google" && profile) {
        const identity = await resolveGoogleUser(String(profile.sub));
        if (!identity) return null;
        applyIdentity(token, identity);
        return token;
      }
      if (account?.provider === "microsoft" && profile) {
        const identity = await resolveMicrosoftUser(profile as unknown as MinecraftIdentity);
        if (!identity) return null;
        applyIdentity(token, identity);
        return token;
      }
      if (user) {
        token.id = user.id as string;
        token.username = user.username;
        token.email = user.email!;
        token.role = user.role;
        token.nloginId = user.nloginId;
        token.sessionVersion = user.sessionVersion;
        token.emailConfirmed = user.emailConfirmed;
        token.checkedAt = Date.now();
        return token;
      }

      // Revalida periodicamente (ou quando o cliente pede com update()): sessão
      // encerrada se a senha mudou, a conta foi desativada/excluída ou o
      // sessionVersion foi incrementado. Também atualiza o nick vinculado.
      const checkedAt = typeof token.checkedAt === "number" ? token.checkedAt : 0;
      // Enquanto o e-mail não estiver confirmado, relê o banco a cada requisição:
      // assim a confirmação vale na hora, sem depender de o cliente pedir update().
      // Tokens antigos, sem essa informação, entram no mesmo caso.
      if (trigger === "update" || token.emailConfirmed !== true || Date.now() - checkedAt > SESSION_RECHECK_MS) {
        const current = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            role: true,
            email: true,
            deactivatedAt: true,
            sessionVersion: true,
            nloginId: true,
            displayName: true,
            emailVerifiedAt: true,
          },
        });

        if (!current || current.deactivatedAt || current.sessionVersion !== token.sessionVersion) {
          return null;
        }

        if (current.nloginId !== token.nloginId) {
          const nlogin = await getNloginById(current.nloginId);
          token.username = nlogin?.last_name ?? current.displayName ?? "Aluno";
          token.nloginId = current.nloginId;
        }
        token.role = current.role;
        token.email = current.email;
        token.emailConfirmed = !!current.emailVerifiedAt && !isPlaceholderEmail(current.email);
        token.checkedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as string;
      session.user.email = token.email as string;
      session.user.role = token.role as "ALUNO" | "PROFESSOR" | "MODERADOR" | "ADMIN";
      session.user.nloginId = (token.nloginId as number | null) ?? null;
      session.user.emailConfirmed = token.emailConfirmed === true;
      return session;
    },
  },
});
