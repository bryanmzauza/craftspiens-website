// =============================================================================
// Fórum: notificações (RN-FORUM-09)
// =============================================================================
// Cada notificação é uma linha em `notifications`, mostrada no sino da navbar
// e em /comunidade/notificacoes. Respostas e menções também saem por e-mail,
// conforme a preferência "Respostas no fórum" do perfil:
//   email: sino + e-mail (no máximo um e-mail por tópico a cada hora)
//   site:  só o sino
//   off:   nada
// Curtidas só vão para o sino e nunca se repetem enquanto a anterior está por ler.
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma-pg";
import { prismaMariaDb } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendForumNotificationEmail } from "@/lib/email";
import { siteUrl } from "@/lib/env";
import { isPlaceholderEmail } from "@/lib/email-verification";
import { markdownToText } from "@/lib/forum/markdown";
import { resolveAuthor } from "@/lib/forum/authors";
import { AUTHOR_SELECT } from "@/lib/forum/authors";

interface NotifyInput {
  userId: string;
  type: NotificationType;
  actorId?: string | null;
  postId?: string | null;
  commentId?: string | null;
  message?: string | null;
}

const EMAIL_TYPES = new Set<NotificationType>(["REPLY_TOPIC", "REPLY_COMMENT", "MENTION"]);
const LIKE_TYPES = new Set<NotificationType>(["LIKE_POST", "LIKE_COMMENT"]);

/** Cria uma notificação; não avisa a própria pessoa nem repete curtidas por ler */
export async function notify(input: NotifyInput): Promise<void> {
  if (input.actorId && input.actorId === input.userId) return;

  let preference = "site";
  if (EMAIL_TYPES.has(input.type)) {
    const profile = await prisma.profile.findUnique({
      where: { userId: input.userId },
      select: { notifForumRespostas: true },
    });
    preference = profile?.notifForumRespostas ?? "email";
    if (preference === "off") return;
  }

  if (LIKE_TYPES.has(input.type)) {
    const pending = await prisma.notification.findFirst({
      where: {
        userId: input.userId,
        type: input.type,
        actorId: input.actorId ?? null,
        postId: input.postId ?? null,
        commentId: input.commentId ?? null,
        readAt: null,
      },
      select: { id: true },
    });
    if (pending) return;
  }

  await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      actorId: input.actorId ?? null,
      postId: input.postId ?? null,
      commentId: input.commentId ?? null,
      message: input.message ?? null,
    },
  });

  if (preference === "email" && EMAIL_TYPES.has(input.type) && input.postId) {
    // Falha no e-mail não derruba a resposta: a notificação no site já existe
    sendEmail(input).catch((error) => console.error("[forum] Erro ao enviar e-mail de notificação:", error));
  }
}

async function sendEmail(input: NotifyInput): Promise<void> {
  const [user, post, actorRow] = await Promise.all([
    prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, emailVerifiedAt: true, nloginId: true, displayName: true, role: true, id: true },
    }),
    prisma.post.findUnique({
      where: { id: input.postId! },
      select: { title: true, slug: true, category: { select: { slug: true } } },
    }),
    input.actorId
      ? prisma.user.findUnique({ where: { id: input.actorId }, select: AUTHOR_SELECT })
      : null,
  ]);
  if (!user || !post) return;
  if (!user.emailVerifiedAt || isPlaceholderEmail(user.email)) return;

  // No máximo um e-mail por tópico a cada hora para a mesma pessoa
  const limit = await checkRateLimit(`forum-email:${input.userId}:${input.postId}`, {
    maxAttempts: 1,
    windowMs: 60 * 60 * 1000,
  });
  if (!limit.success) return;

  const comment = input.commentId
    ? await prisma.comment.findUnique({ where: { id: input.commentId }, select: { content: true } })
    : null;

  const [recipient, actor] = await Promise.all([
    resolveAuthor({ id: user.id, role: user.role, nloginId: user.nloginId, displayName: user.displayName }),
    actorRow ? resolveAuthor(actorRow) : null,
  ]);

  const url = `${siteUrl()}/comunidade/${post.category.slug}/${post.slug}${input.commentId ? `#comentario-${input.commentId}` : ""}`;
  await sendForumNotificationEmail(user.email, {
    username: recipient.username,
    actor: actor?.username ?? "Alguém",
    kind: input.type === "MENTION" ? "mencao" : input.type === "REPLY_COMMENT" ? "resposta-comentario" : "resposta-topico",
    topicTitle: post.title,
    excerpt: comment ? markdownToText(comment.content, 240) : "",
    url,
  });
}

/** Avisa toda a moderação (ex.: nova denúncia) */
export async function notifyModerators(input: Omit<NotifyInput, "userId">): Promise<void> {
  const moderators = await prisma.user.findMany({
    where: { role: { in: ["MODERADOR", "ADMIN"] }, deactivatedAt: null },
    select: { id: true },
  });
  await Promise.all(moderators.map((m) => notify({ ...input, userId: m.id })));
}

/** Usuários do site correspondentes aos nicks mencionados (@nick) */
export async function findUserIdsByNicks(nicks: string[]): Promise<string[]> {
  if (nicks.length === 0) return [];
  const nlogins = await prismaMariaDb.nlogin.findMany({
    where: { last_name: { in: nicks } },
    select: { id: true },
  });
  if (nlogins.length === 0) return [];
  const users = await prisma.user.findMany({
    where: { nloginId: { in: nlogins.map((n) => n.id) }, deactivatedAt: null },
    select: { id: true },
  });
  return users.map((u) => u.id);
}

/** Notifica as menções de um texto, sem repetir quem já foi avisado por outro motivo */
export async function notifyMentions(
  mentions: string[],
  context: { actorId: string; postId: string; commentId?: string | null; skipUserIds?: string[] }
): Promise<void> {
  const ids = await findUserIdsByNicks(mentions);
  const skip = new Set(context.skipUserIds ?? []);
  await Promise.all(
    ids
      .filter((id) => !skip.has(id))
      .map((userId) =>
        notify({
          userId,
          type: "MENTION",
          actorId: context.actorId,
          postId: context.postId,
          commentId: context.commentId ?? null,
        })
      )
  );
}
