# Página 06 — Comunidade (Fórum)

> **Rotas**: `/comunidade`, `/comunidade/[categoria]`, `/comunidade/[categoria]/[topico]`, `/comunidade/membros`, `/comunidade/membro/[nick]`, `/comunidade/notificacoes`, `/comunidade/moderacao`
> **Acesso**: Público (leitura) / Logado com nick vinculado (participar) / Moderação (`MODERADOR` e `ADMIN`) para a página de moderação
> **Lançamento**: ainda restrita ao grupo `dev` do LuckPerms; os demais veem "Em breve" e as APIs `/api/forum/*` respondem 403 (ver `src/lib/dev-access.ts` e a seção "Lançamento" abaixo)
> **Propósito**: Fórum da comunidade para discussões, dúvidas, denúncias e interação entre alunos, professores e equipe.

---

## Código

| Parte | Onde |
|-------|------|
| Regras puras (Markdown, permissões, reputação, banimento, slugs, datas) | `src/lib/forum/*.ts`, com testes em `src/lib/forum/*.test.ts` (`npm test`) |
| Acesso e notificações (servidor) | `src/lib/forum/access.ts`, `src/lib/forum/notifications.ts`, `src/lib/forum/authors.ts` |
| APIs | `src/app/api/forum/*` |
| Páginas | `src/app/comunidade/*` (server, metadados) e `src/components/comunidade/*` (cliente) |
| E-mail de notificação | `sendForumNotificationEmail` em `src/lib/email.ts` |
| Estilo do Markdown | `.forum-markdown` em `src/app/globals.css` |
| Categorias iniciais | `scripts/seed-forum.mjs` (`npm run db:seed:forum`) |

---

## Regras de Negócio

### RN-FORUM-01: Página principal (`/comunidade`)
- Hero "COMUNIDADE" com breadcrumb Home > Comunidade
- Busca em todo o fórum (título e conteúdo, sem diferenciar maiúsculas); os resultados aparecem no lugar das categorias, com paginação, e a busca fica na URL (`?busca=`). Também filtra por tag (`?tag=`)
- Lista de categorias com ícone, nome, descrição, quantidade de tópicos e de comentários, e o último tópico (título, autor e tempo)
- Seção "Atividade recente" com os 6 tópicos de atividade mais recente em todo o fórum
- Estatísticas: tópicos, comentários e membros; "membros" leva à lista de membros (RN-FORUM-12)
- Botões: Novo tópico (logado), Notificações (logado), Moderação (moderação)

### RN-FORUM-02: Categorias
- Criadas pelo seed (`scripts/seed-forum.mjs`), idempotente pelo slug:
  - **Anúncios** (somente equipe) — Novidades oficiais
  - **Geral** — Discussões livres
  - **Dúvidas de Aulas** — Perguntas sobre disciplinas e conteúdos
  - **Sugestões** — Ideias para o servidor e a plataforma
  - **Bugs & Problemas** — Problemas do servidor ou do site
  - **Showroom** — Construções e conquistas
  - **Off-Topic** — Assuntos fora do tema
  - **Denúncias** — Denúncias de jogadores e de conteúdo (ver RN-FORUM-08)
- O campo `icon` guarda o nome do ícone do Lucide (`CategoryIcon.tsx`)
- Categorias `staffOnly` aceitam tópicos só de `PROFESSOR`, `MODERADOR` e `ADMIN`; todos leem

### RN-FORUM-03: Lista de tópicos (`/comunidade/[categoria]`)
- Cada tópico mostra: avatar da skin, título, trecho do conteúdo, autor com tag de cargo, tempo da última atividade, comentários, visualizações e até 3 tags
- Ícones de estado: fixado, fechado, resolvido, privado
- Ordenação (`?ordem=`): `atividade` (padrão: fixados primeiro, depois última atividade), `recentes`, `comentados`, `vistos`
- Filtro (`?filtro=`): `todos`, `abertos`, `resolvidos`, `sem-resposta`
- Busca na categoria (`?busca=`) e filtro por tag (`?tag=`)
- Paginação de 20 por página (`?pagina=`)
- Botão "Novo tópico" (logado; nas categorias da equipe, só para ela). Na categoria Denúncias o botão chama "Nova denúncia" e a página mostra as instruções de como denunciar

### RN-FORUM-04: Tópico e comentários (`/comunidade/[categoria]/[topico]`)
- Título e descrição da página vêm do tópico (`generateMetadata`); tópicos privados usam o texto genérico
- Post original: título, estado, data, "editado" quando foi alterado, visualizações, comentários, tags clicáveis; autor com skin, nick (link para a página do membro), cargo, reputação, tópicos e comentários, bio
- Conteúdo em Markdown (RN-FORUM-10), convertido no servidor
- Ações: curtir e descurtir (com o estado atual destacado, sem reagir ao próprio conteúdo), compartilhar (copia o link), reportar (abre uma denúncia pré-preenchida), editar e excluir (conforme RN-FORUM-07), marcar como resolvido (autor ou moderação)
- Barra de moderação (moderação): fixar, fechar, tornar privado, mover de categoria
- Comentários em ordem cronológica, 30 por página, com respostas aninhadas em 1 nível; cada um com curtir, descurtir, responder, editar, excluir e reportar; "editado" quando alterado
- Links `#comentario-<id>` abrem a página certa dos comentários e destacam o comentário (usados nas notificações)
- Responder: editor Markdown com barra de ferramentas e pré-visualização; "Responder" num comentário preenche `@nick` e marca a resposta como aninhada. Depois de enviar, a página vai até o comentário novo
- Tópico fechado: só a moderação comenta
- Visualizações só contam para quem não é o autor

### RN-FORUM-05: Criação de tópico (logado)
- Diálogo com categoria (pré-selecionada na página da categoria), título (até 200 caracteres), conteúdo em Markdown (20 a 20.000 caracteres) com pré-visualização, e tags opcionais (até 5, com até 20 caracteres, normalizadas como slug)
- Exige nick do Minecraft vinculado (o autor aparece pelo nick); sem ele a API responde 403 com `code: "SemNick"` e a tela mostra o link para Configurações
- Exige data de nascimento registrada (`code: "SemIdade"`), que contas do Google informam em Configurações > Dados pessoais
- Exige e-mail confirmado (bloqueio no proxy para escritas em `/api/forum`)
- As mesmas exigências valem para comentar e reagir (`requireWriter` em `src/lib/forum/access.ts`); quem está sem algum item vê o aviso no topo do site (ver `09-perfil.md`)
- Validações: título duplicado na mesma categoria em 24h (sem diferenciar maiúsculas) responde 409; rate limit de 5 tópicos por hora; conta com menos de 1 hora não cria tópicos (exceto equipe)
- O slug vem do título; repetido ganha sufixo numérico

### RN-FORUM-06: Reputação
- Pontuação: +1 por tópico, +1 por comentário, +2 por curtida recebida em tópico, +1 por curtida recebida em comentário, -1 por descurtida recebida
- Tags por faixa: Iniciante (0 a 10), Participante (11 a 50), Colaborador (51 a 200), Referência (201+). Os nomes são diferentes das tags de tempo de servidor do perfil (Novato, Membro, Veterano, Lenda) para não confundir as duas escalas
- Exibida no tópico, ao lado do autor, e na página do membro

### RN-FORUM-07: Permissões e moderação
| Ação | Quem |
|------|------|
| Editar tópico ou comentário | Autor em até 30 minutos; moderação sempre |
| Excluir tópico ou comentário | Autor, se não tiver respostas; moderação sempre |
| Marcar como resolvido | Autor do tópico ou moderação |
| Fixar, fechar, reabrir, tornar privado ou público, mover de categoria | Moderação |
| Criar tópico em categoria da equipe | `PROFESSOR`, `MODERADOR`, `ADMIN` |
| Suspender do fórum | Moderação, nunca contra outra pessoa da moderação |

- Moderação = `MODERADOR` e `ADMIN` (`canModerate` em `src/lib/forum/permissions.ts`). `PROFESSOR` tem a tag e as categorias da equipe, mas não modera
- Ações da moderação sobre o conteúdo de alguém geram uma notificação para o autor (fechado, movido, privado, removido)
- Suspensão (banimento): na página do membro, com duração de 1 a 365 dias ou permanente e um motivo que o membro vê. Quem está suspenso continua lendo, mas não cria tópicos, comentários nem reações (403 com `code: "Banido"`). Campos `forumBannedUntil`, `forumBanReason` e `forumBannedById` em `users`
- Página `/comunidade/moderacao` (só moderação; os demais recebem 404): denúncias abertas, suspensões ativas, tópicos fechados e privados

### RN-FORUM-08: Denúncias
- São tópicos da categoria `denuncias` (`REPORTS_CATEGORY_SLUG` em `src/lib/forum/constants.ts`), por isso têm comentários, notificações e moderação como qualquer tópico
- Nascem públicas. Se o assunto for sensível, a moderação marca o tópico como privado: só o autor e a moderação veem; ele some das listas, da busca, da página principal e dos metadados
- O botão "Reportar" num tópico ou comentário abre o diálogo de novo tópico já na categoria Denúncias, com o link do conteúdo e o nick do autor preenchidos, e os campos Motivo e Provas para completar
- Cada denúncia nova notifica toda a moderação (tipo `REPORT`)
- Encerrar a denúncia = marcar como resolvido (autor ou moderação); a página de moderação lista as abertas

### RN-FORUM-09: Notificações
- Tabela `notifications`; tipos: `REPLY_TOPIC`, `REPLY_COMMENT`, `LIKE_POST`, `LIKE_COMMENT`, `MENTION`, `MODERATION`, `REPORT`
- Geradas em: resposta ao seu tópico, resposta ao seu comentário, curtida recebida (uma por pessoa e conteúdo enquanto não for lida), menção `@nick` em tópico ou comentário (também em edições, só para nicks novos), ações da moderação, nova denúncia (para a moderação)
- Nunca para a própria pessoa; respostas, menções e curtidas não se somam para o mesmo evento
- Sino na navbar (desktop e celular) com a contagem por ler, atualizada a cada minuto e ao abrir; abrir o sino marca as mostradas como lidas. Página `/comunidade/notificacoes` com todas, paginadas, e "Marcar todas como lidas"
- E-mail: preferência "Respostas e menções no fórum" em Configurações > Notificações (`notifForumRespostas` em `profiles`): `email` = sino e e-mail, `site` = só o sino, `off` = nada. O e-mail vai só com e-mail confirmado, no máximo um por tópico a cada hora para a mesma pessoa (chave `forum-email:<usuário>:<tópico>` em `rate_limits`). Curtidas nunca vão por e-mail
- Quando a seção está restrita, o sino some para quem recebe 403 e para de consultar até a próxima sessão

### RN-FORUM-10: Markdown
- Conversor próprio em `src/lib/forum/markdown.ts`, usado no servidor (API) e no navegador (pré-visualização). Todo o texto é escapado antes de qualquer transformação; só saem as tags geradas pelo conversor, com atributos conferidos
- Suportado: parágrafos e quebras de linha, títulos (`#` a `###`, rebaixados para h2 a h4), negrito, itálico, riscado, código em linha e em bloco, citações, listas com e sem ordem, linha horizontal, links (`http`, `https` ou caminho do site; externos abrem em nova aba com `rel="nofollow noopener noreferrer"`), imagens por URL `https` (sem upload; a CSP do site só permite imagens https), URLs soltas viram links, menções `@nick` viram link para a página do membro
- `extractMentions` ignora código; `markdownToText` gera os trechos das listas, das notificações e dos metadados

### RN-FORUM-11: Página do membro (`/comunidade/membro/[nick]`)
- Pública; encontra o membro pelo nick do nLogin. Mostra skin, cargo do servidor (LuckPerms), papel no site, tag de tempo de servidor, datas de entrada, bio (se o perfil for público), reputação com tag, tópicos, comentários e curtidas recebidas, tópicos e comentários recentes
- Para a moderação: detalhes da suspensão e o botão de suspender ou encerrar a suspensão
- O e-mail e demais dados pessoais nunca aparecem

### RN-FORUM-12: Lista de membros (`/comunidade/membros`)
- Pública; lista os membros com nick vinculado (os que podem participar do fórum), 24 por página, com skin, nick, cargo, tópicos, comentários e data de entrada no site; cada cartão abre a página do membro
- Busca pelo nick (`?busca=`, feita no nLogin) e ordenação (`?ordem=`): `ativos` (padrão: mais tópicos e comentários), `recentes`, `antigos`
- A tag "Suspenso" só aparece para a moderação

---

## APIs

Todas sob `/api/forum`. Leitura é pública (tópicos privados só para quem pode ver); escrita exige login, e-mail confirmado (proxy) e, nas rotas marcadas, nick vinculado e conta sem suspensão (`requireWriter` em `src/lib/forum/access.ts`).

| Método e rota | Função |
|---------------|--------|
| `GET /categorias` | Categorias com contagens, último tópico e totais |
| `GET /topicos?categoria=&busca=&tag=&pagina=&ordem=&filtro=&limite=` | Lista ou busca de tópicos; sem `categoria`, em todo o fórum |
| `POST /topicos` | Cria tópico (nick, suspensão, rate limit, idade da conta, duplicidade) |
| `GET /topicos/[slug]` | Tópico com HTML, reações, reputação do autor e permissões do usuário atual (`can`) |
| `PUT /topicos/[slug]` | Edita (`title`, `content`, `tags`), resolve (`resolved`), modera (`pinned`, `locked`, `private`, `categoryId`) |
| `DELETE /topicos/[slug]` | Exclui o tópico (cascata em comentários, reações e notificações) |
| `GET /comentarios?topicoId=&pagina=1|ultima&comentario=` | Comentários paginados; `comentario` devolve a página que contém aquele comentário |
| `POST /comentarios` | Cria comentário ou resposta; devolve a página em que ele ficou |
| `PUT /comentarios/[id]`, `DELETE /comentarios/[id]` | Edita ou exclui |
| `POST /reacoes` | Alterna curtir/descurtir em `postId` ou `commentId`; devolve as contagens |
| `GET /notificacoes?pagina=`, `PUT /notificacoes` | Lista e marca como lidas (`{ ids }` ou `{ todas: true }`) |
| `GET /notificacoes/contagem` | Só o número por ler (sino) |
| `GET /membros?busca=&ordem=&pagina=` | Lista de membros com nick vinculado |
| `GET /membros/[nick]` | Página pública do membro |
| `POST /banimentos`, `DELETE /banimentos` | Suspende (`{ userId, dias, motivo }`) ou encerra a suspensão (`{ userId }`) |
| `GET /moderacao` | Denúncias abertas, suspensões ativas e contagens |

Rate limits (`src/lib/rate-limit.ts`): 5 tópicos/hora, 10 comentários/15 min, 60 reações/min por usuário.

---

## Modelo de Dados (PostgreSQL, `prisma/schema.pg.prisma`)

| Modelo | Campos relevantes |
|--------|-------------------|
| `ForumCategory` | `name`, `slug`, `description`, `icon`, `order`, `staffOnly`, `active` |
| `Post` | `title`, `slug`, `content` (Markdown), `authorId`, `categoryId`, `pinned`, `locked`, `resolved`, `private`, `views`, `tags` (JSON de strings), `editedAt`, `lastActivityAt` |
| `Comment` | `content`, `authorId`, `postId`, `parentId` (1 nível), `editedAt` |
| `Reaction` | `userId`, `postId` ou `commentId`, `type` (`LIKE`, `DISLIKE`); uma por usuário e conteúdo |
| `Notification` | `userId`, `type`, `actorId`, `postId`, `commentId`, `message`, `readAt` |
| `User` | `forumBannedUntil`, `forumBanReason`, `forumBannedById` |

O antigo modelo `Report` foi removido: as denúncias são tópicos.

---

## Segurança

- Markdown escapado antes de converter; links e imagens só com esquemas permitidos; imagens só por `https` (CSP `img-src https:`)
- Tópicos privados filtrados em todas as listas, buscas, contagens, comentários, reações e metadados (`visiblePostsWhere` e `canViewPost`)
- Escrita exige e-mail confirmado (proxy), nick vinculado e conta sem suspensão; papel e suspensão lidos do banco na hora, não da sessão
- Rate limits persistentes no PostgreSQL; anti-spam por idade da conta; duplicidade de título em 24h
- Reações ao próprio conteúdo são recusadas (evita inflar a reputação)
- A moderação não suspende outra pessoa da moderação nem a si mesma
- Nenhum dado pessoal nas respostas públicas (só nick, skin, cargo e estatísticas)

---

## Lançamento

1. Aplicar o schema na produção: `npm run db:push:pg` (deploy manual com `--com-schema`, depois do backup; o deploy automático bloqueia commits que mudam o schema)
2. Criar a categoria Denúncias: `npm run db:seed:forum` (idempotente)
3. Testar com uma conta do grupo `dev`: criar tópico, comentar, reagir, reportar, moderar, suspender, conferir o sino e o e-mail
4. Abrir para todos: apagar `src/app/comunidade/layout.tsx` e tirar `/api/forum` de `devOnlyApis` em `src/proxy.ts`

---

## SEO

| Meta | Valor |
|------|-------|
| **Title** (principal) | Comunidade — CraftSapiens \| Fórum |
| **Title** (categoria) | `<Categoria>` — CraftSapiens \| Comunidade |
| **Title** (tópico) | `<Título do tópico>` — CraftSapiens \| Comunidade |
| **Description** (tópico) | Primeiros 160 caracteres do conteúdo, sem formatação |
