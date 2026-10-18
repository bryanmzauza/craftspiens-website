// =============================================================================
// Fórum: quem pode fazer o quê (RN-FORUM-05 e RN-FORUM-07)
// =============================================================================
// Funções puras, usadas pelas APIs e cobertas por testes.
import { EDIT_WINDOW_MS } from "@/lib/forum/constants";

export type Role = "ALUNO" | "PROFESSOR" | "MODERADOR" | "ADMIN";

export interface ForumUser {
  id: string;
  role: Role | string;
}

/** Staff: cria tópicos em categorias restritas, sem limite de idade da conta, com tag ao lado do nick */
export function isStaff(role: string | null | undefined): boolean {
  return role === "MODERADOR" || role === "ADMIN" || role === "PROFESSOR";
}

/** Moderação: fixar, fechar, privar, mover, banir, e editar ou excluir conteúdo de qualquer pessoa */
export function canModerate(role: string | null | undefined): boolean {
  return role === "MODERADOR" || role === "ADMIN";
}

interface Authored {
  authorId: string;
  createdAt: Date | string;
}

/** Autor dentro do prazo de edição, ou moderação */
export function canEdit(item: Authored, user: ForumUser | null | undefined, now = Date.now()): boolean {
  if (!user) return false;
  if (canModerate(user.role)) return true;
  if (item.authorId !== user.id) return false;
  return now - new Date(item.createdAt).getTime() <= EDIT_WINDOW_MS;
}

/** Autor sem respostas, ou moderação */
export function canDelete(
  item: { authorId: string; replyCount: number },
  user: ForumUser | null | undefined
): boolean {
  if (!user) return false;
  if (canModerate(user.role)) return true;
  return item.authorId === user.id && item.replyCount === 0;
}

/** Autor do tópico ou moderação marcam como resolvido */
export function canResolve(post: { authorId: string }, user: ForumUser | null | undefined): boolean {
  if (!user) return false;
  return canModerate(user.role) || post.authorId === user.id;
}

/** Quem pode ser banido: só quem não é da moderação */
export function canBan(actorRole: string, targetRole: string): boolean {
  return canModerate(actorRole) && !canModerate(targetRole);
}

/** Tópico privado: só o autor e a moderação veem */
export function canViewPost(
  post: { private: boolean; authorId: string },
  user: ForumUser | null | undefined
): boolean {
  if (!post.private) return true;
  if (!user) return false;
  return canModerate(user.role) || post.authorId === user.id;
}

/** Condição do Prisma para listar só os tópicos que o usuário pode ver */
export function visiblePostsWhere(user: ForumUser | null | undefined): Record<string, unknown> {
  if (user && canModerate(user.role)) return {};
  if (user) return { OR: [{ private: false }, { authorId: user.id }] };
  return { private: false };
}
