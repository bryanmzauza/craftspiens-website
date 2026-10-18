// =============================================================================
// Fórum: reputação (RN-FORUM-06)
// =============================================================================
// +1 por tópico, +1 por comentário, +2 por curtida em tópico, +1 por curtida em
// comentário, -1 por descurtida recebida.

export interface ReputationInput {
  posts: number;
  comments: number;
  likesOnPosts: number;
  likesOnComments: number;
  dislikes: number;
}

export function computeReputation(input: ReputationInput): number {
  return (
    input.posts +
    input.comments +
    input.likesOnPosts * 2 +
    input.likesOnComments -
    input.dislikes
  );
}

export interface ReputationBadge {
  label: string;
  min: number;
}

// Nomes diferentes das tags de tempo de servidor (Novato, Membro, Veterano,
// Lenda, em src/lib/player-profile.ts) para não confundir as duas escalas
export const REPUTATION_BADGES: ReputationBadge[] = [
  { label: "Referência", min: 201 },
  { label: "Colaborador", min: 51 },
  { label: "Participante", min: 11 },
  { label: "Iniciante", min: 0 },
];

export function getReputationBadge(reputation: number): ReputationBadge {
  return (
    REPUTATION_BADGES.find((badge) => reputation >= badge.min) ??
    REPUTATION_BADGES[REPUTATION_BADGES.length - 1]
  );
}
