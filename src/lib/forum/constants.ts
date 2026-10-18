// =============================================================================
// Fórum da comunidade: limites e nomes fixos
// =============================================================================
// Regras em docs/paginas/06-comunidade.md.

/** Slug da categoria onde as denúncias são abertas (scripts/seed-forum.mjs) */
export const REPORTS_CATEGORY_SLUG = "denuncias";

export const TITLE_MAX = 200;
export const CONTENT_MIN = 20;
export const CONTENT_MAX = 20_000;
export const COMMENT_MIN = 2;
export const COMMENT_MAX = 5_000;
export const TAGS_MAX = 5;
export const TAG_MAX_LENGTH = 20;

export const TOPICS_PER_PAGE = 20;
export const COMMENTS_PER_PAGE = 30;
export const NOTIFICATIONS_PER_PAGE = 30;

/** Prazo em que o autor pode editar o próprio tópico ou comentário (RN-FORUM-07) */
export const EDIT_WINDOW_MS = 30 * 60 * 1000;
/** Idade mínima da conta para criar tópicos (RN-FORUM-05) */
export const MIN_ACCOUNT_AGE_MS = 60 * 60 * 1000;

/** Ordenações aceitas na lista de tópicos */
export const TOPIC_SORTS = ["atividade", "recentes", "comentados", "vistos"] as const;
export type TopicSort = (typeof TOPIC_SORTS)[number];

/** Filtros aceitos na lista de tópicos */
export const TOPIC_FILTERS = ["todos", "abertos", "resolvidos", "sem-resposta"] as const;
export type TopicFilter = (typeof TOPIC_FILTERS)[number];
