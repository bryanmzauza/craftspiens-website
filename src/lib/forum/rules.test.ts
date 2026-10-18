import { describe, expect, it } from "vitest";
import {
  canBan,
  canDelete,
  canEdit,
  canModerate,
  canResolve,
  canViewPost,
  isStaff,
  visiblePostsWhere,
} from "@/lib/forum/permissions";
import { computeReputation, getReputationBadge } from "@/lib/forum/reputation";
import { normalizeTags, parseTags, slugify } from "@/lib/forum/slug";
import { banExpiry, describeBan, isBanned, isPermanentBan, PERMANENT_BAN } from "@/lib/forum/ban";
import { timeAgo } from "@/lib/forum/time";
import { EDIT_WINDOW_MS } from "@/lib/forum/constants";

const aluno = { id: "u1", role: "ALUNO" };
const outro = { id: "u2", role: "ALUNO" };
const professor = { id: "p1", role: "PROFESSOR" };
const moderador = { id: "m1", role: "MODERADOR" };

describe("papéis", () => {
  it("staff inclui professor; moderação não", () => {
    expect(isStaff("PROFESSOR")).toBe(true);
    expect(canModerate("PROFESSOR")).toBe(false);
    expect(canModerate("ADMIN")).toBe(true);
    expect(isStaff("ALUNO")).toBe(false);
  });
});

describe("canEdit", () => {
  const now = Date.now();
  const item = { authorId: "u1", createdAt: new Date(now - 10 * 60 * 1000) };

  it("autor edita dentro do prazo", () => {
    expect(canEdit(item, aluno, now)).toBe(true);
    expect(canEdit(item, aluno, now + EDIT_WINDOW_MS)).toBe(false);
  });

  it("outros não editam; moderação sempre", () => {
    expect(canEdit(item, outro, now)).toBe(false);
    expect(canEdit(item, professor, now)).toBe(false);
    expect(canEdit(item, moderador, now + 10 * EDIT_WINDOW_MS)).toBe(true);
    expect(canEdit(item, null, now)).toBe(false);
  });
});

describe("canDelete / canResolve", () => {
  it("autor exclui só sem respostas", () => {
    expect(canDelete({ authorId: "u1", replyCount: 0 }, aluno)).toBe(true);
    expect(canDelete({ authorId: "u1", replyCount: 2 }, aluno)).toBe(false);
    expect(canDelete({ authorId: "u1", replyCount: 2 }, moderador)).toBe(true);
  });

  it("autor e moderação resolvem", () => {
    expect(canResolve({ authorId: "u1" }, aluno)).toBe(true);
    expect(canResolve({ authorId: "u1" }, outro)).toBe(false);
    expect(canResolve({ authorId: "u1" }, moderador)).toBe(true);
  });
});

describe("banimento", () => {
  it("moderação bane alunos e professores, nunca a própria moderação", () => {
    expect(canBan("MODERADOR", "ALUNO")).toBe(true);
    expect(canBan("ADMIN", "PROFESSOR")).toBe(true);
    expect(canBan("MODERADOR", "ADMIN")).toBe(false);
    expect(canBan("PROFESSOR", "ALUNO")).toBe(false);
  });

  it("calcula vigência e descrição", () => {
    const now = Date.UTC(2026, 9, 18, 12);
    expect(isBanned({ until: null }, now)).toBe(false);
    expect(isBanned({ until: new Date(now - 1) }, now)).toBe(false);
    expect(isBanned({ until: banExpiry(7, now) }, now)).toBe(true);
    expect(isBanned({ until: banExpiry(7, now) }, now + 8 * 24 * 60 * 60 * 1000)).toBe(false);
    expect(isPermanentBan(banExpiry(null, now))).toBe(true);
    expect(banExpiry(null, now)).toEqual(PERMANENT_BAN);
    expect(describeBan(PERMANENT_BAN)).toBe("permanentemente");
    expect(describeBan(new Date(Date.UTC(2027, 2, 12, 15)))).toBe("até 12/03/2027");
  });
});

describe("tópicos privados", () => {
  const privado = { private: true, authorId: "u1" };

  it("autor e moderação veem; os demais não", () => {
    expect(canViewPost(privado, aluno)).toBe(true);
    expect(canViewPost(privado, moderador)).toBe(true);
    expect(canViewPost(privado, outro)).toBe(false);
    expect(canViewPost(privado, null)).toBe(false);
    expect(canViewPost({ private: false, authorId: "u1" }, null)).toBe(true);
  });

  it("monta a condição de listagem", () => {
    expect(visiblePostsWhere(null)).toEqual({ private: false });
    expect(visiblePostsWhere(aluno)).toEqual({ OR: [{ private: false }, { authorId: "u1" }] });
    expect(visiblePostsWhere(moderador)).toEqual({});
  });
});

describe("reputação", () => {
  it("soma conforme a regra", () => {
    expect(computeReputation({ posts: 3, comments: 4, likesOnPosts: 2, likesOnComments: 5, dislikes: 1 })).toBe(15);
  });

  it("atribui a tag pela faixa", () => {
    expect(getReputationBadge(0).label).toBe("Iniciante");
    expect(getReputationBadge(10).label).toBe("Iniciante");
    expect(getReputationBadge(11).label).toBe("Participante");
    expect(getReputationBadge(51).label).toBe("Colaborador");
    expect(getReputationBadge(500).label).toBe("Referência");
    expect(getReputationBadge(-5).label).toBe("Iniciante");
  });
});

describe("slug e tags", () => {
  it("gera slugs sem acentos", () => {
    expect(slugify("Dúvida: como ganhar XP?!")).toBe("duvida-como-ganhar-xp");
    expect(slugify("a".repeat(300)).length).toBe(250);
  });

  it("normaliza tags", () => {
    expect(normalizeTags(["Redstone", "redstone", " Mapa Novo ", ""])).toEqual(["redstone", "mapa-novo"]);
    expect(normalizeTags(["a", "b", "c", "d", "e", "f"])).toHaveLength(5);
    expect(normalizeTags(undefined)).toEqual([]);
    expect(normalizeTags("x")).toBeNull();
    expect(normalizeTags([1])).toBeNull();
  });

  it("lê as tags do banco com tolerância", () => {
    expect(parseTags('["a","b"]')).toEqual(["a", "b"]);
    expect(parseTags("{")).toEqual([]);
    expect(parseTags(null)).toEqual([]);
  });
});

describe("timeAgo", () => {
  const now = Date.UTC(2026, 9, 18, 12);
  const minutes = (n: number) => new Date(now - n * 60_000);

  it("descreve a distância em português", () => {
    expect(timeAgo(minutes(0), now)).toBe("agora");
    expect(timeAgo(minutes(5), now)).toBe("há 5 min");
    expect(timeAgo(minutes(3 * 60), now)).toBe("há 3 h");
    expect(timeAgo(minutes(30 * 60), now)).toBe("ontem");
    expect(timeAgo(minutes(5 * 24 * 60), now)).toBe("há 5 dias");
    expect(timeAgo(minutes(45 * 24 * 60), now)).toBe("há 1 mês");
    expect(timeAgo(minutes(400 * 24 * 60), now)).toBe("há 1 ano");
  });
});
