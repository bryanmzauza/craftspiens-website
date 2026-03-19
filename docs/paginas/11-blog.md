# 📰 Página 11 — Blog

> **Rota**: `/blog`, `/blog/[slug]`
> **Acesso**: Público
> **Propósito**: Publicar notícias, atualizações e artigos sobre a CraftSapiens.

---

## Regras de Negócio

### RN-BLOG-01: Hero da Página
- Título: **"BLOG"** em fonte Minecraft
- Subtítulo: "Novidades, atualizações e muito conteúdo."
- Breadcrumb: Home > Blog

### RN-BLOG-02: Lista de Posts (`/blog`)
- Grid de cards com os posts mais recentes
- Cada card:
  - Imagem de capa (thumbnail)
  - Categoria (badge colorido)
  - Título do post
  - Resumo (primeiras 150 caracteres)
  - Data de publicação
  - Autor (avatar + nome)
  - Tempo de leitura estimado
- Ordenação: mais recente primeiro
- Paginação: 9 posts por página (grid 3x3)
- Post mais recente pode ter destaque (card maior)

### RN-BLOG-03: Categorias
- Sidebar ou filtro de categorias:
  - **Novidades** — Atualizações do servidor e plataforma
  - **Aulas** — Conteúdo sobre as aulas gamificadas
  - **Eventos** — Eventos no servidor
  - **Mídia** — Aparições na mídia e parcerias
  - **Tutoriais** — Guias e dicas
  - **Comunidade** — Destaque de membros e construções
- Filtro ativo destacado
- URL: `/blog?categoria=novidades`

### RN-BLOG-04: Busca
- Campo de busca no blog
- Pesquisa por: título, conteúdo, tags
- Resultados com highlight do termo

### RN-BLOG-05: Post Individual (`/blog/[slug]`)
- Conteúdo completo do post:
  - Imagem de capa (hero do post)
  - Título
  - Autor (foto + nome + mini bio)
  - Data de publicação
  - Categoria
  - Tempo de leitura
  - Conteúdo formatado (Markdown/Rich text com imagens, vídeos embed, etc.)
  - Tags
- Navegação: "← Post anterior" | "Próximo post →"
- Seção "Posts relacionados" (mesma categoria, 3 cards)
- Compartilhar: botões Twitter, Facebook, WhatsApp, copiar link
- Comentários: integrados com o fórum (se logado) ou widget simples

### RN-BLOG-06: Sidebar (Desktop)
- Posts populares (mais lidos)
- Categorias com contagem de posts
- Tags cloud
- Widget do servidor (jogadores online)
- CTA de newsletter

### RN-BLOG-07: Admin — Gerenciamento de Posts
- Área administrativa (acesso restrito a Staff):
  - Criar, editar, excluir posts
  - Upload de imagens
  - Definir categoria e tags
  - Agendar publicação
  - Rascunhos
  - Preview antes de publicar
- Rota: `/admin/blog` (protegida por role)

---

## Wireframe Textual

### Lista (`/blog`)

```
┌──────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                          │
├──────────────────────────────────────────────────────────────────┤
│  Home > Blog                                                       │
│                                                                    │
│  ██████████                                                        │
│  █  BLOG  █                                                        │
│  ██████████                                                        │
│                                                                    │
│  🔍 [Buscar no blog...                              ]             │
│                                                                    │
│  Categorias: [Todos] [Novidades] [Aulas] [Eventos] [Mídia]        │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ [                  IMAGEM DE CAPA                      ]│      │
│  │                                                         │      │
│  │  📰 NOVIDADES                                           │      │
│  │  Título do Post em Destaque                             │      │
│  │  Resumo do post mais recente que aparece maior...       │      │
│  │  📅 19/03/2026  |  👤 Prof. Helton  |  ⏱️ 5 min        │      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ [Imagem]     │  │ [Imagem]     │  │ [Imagem]     │            │
│  │ 🎮 EVENTOS   │  │ 📰 NOVIDADES │  │ 🎓 AULAS     │            │
│  │ Título do    │  │ Título do    │  │ Título do    │            │
│  │ Post 2       │  │ Post 3       │  │ Post 4       │            │
│  │ Resumo...    │  │ Resumo...    │  │ Resumo...    │            │
│  │ 📅 18/03     │  │ 📅 15/03     │  │ 📅 12/03     │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ [Imagem]     │  │ [Imagem]     │  │ [Imagem]     │            │
│  │ Post 5       │  │ Post 6       │  │ Post 7       │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                    │
│  Página: [1] [2] [3]                                               │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Post (`/blog/[slug]`)

```
┌──────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                          │
├──────────────────────────────────────────────────────────────────┤
│  Home > Blog > Título do Post                                      │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────┐      │
│  │ [           IMAGEM DE CAPA DO POST                     ]│      │
│  └─────────────────────────────────────────────────────────┘      │
│                                                                    │
│  📰 NOVIDADES                                                      │
│                                                                    │
│  # Título Completo do Post                                         │
│                                                                    │
│  ┌────┐ Prof. Helton  |  📅 19/03/2026  |  ⏱️ 5 min leitura     │
│  │foto│                                                            │
│  └────┘                                                            │
│                                                                    │
│  [Conteúdo completo do post em rich text]                          │
│  Lorem ipsum dolor sit amet...                                     │
│  ...                                                               │
│  ...                                                               │
│                                                                    │
│  Tags: [minecraft] [aulas] [novidade]                              │
│                                                                    │
│  Compartilhar: [Twitter] [Facebook] [WhatsApp] [📋 Copiar]        │
│                                                                    │
│  ← Post anterior  |  Próximo post →                                │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│  POSTS RELACIONADOS                                                │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ Post Relac.1 │  │ Post Relac.2 │  │ Post Relac.3 │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

### Post

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `titulo` | VARCHAR(200) | ✅ |
| `slug` | VARCHAR(250) UNIQUE | ✅ |
| `resumo` | VARCHAR(300) | ✅ |
| `conteudo` | TEXT (Markdown) | ✅ |
| `imagem_capa` | VARCHAR(255) | ❌ |
| `autor_id` | INT (FK) | ✅ |
| `categoria_id` | INT (FK) | ✅ |
| `tags` | JSON | ❌ |
| `status` | ENUM (rascunho, publicado, agendado) | ✅ |
| `publicado_em` | DATETIME | ❌ |
| `views` | INT | ✅ |
| `tempo_leitura` | INT (minutos) | ✅ |
| `created_at` | DATETIME | ✅ |
| `updated_at` | DATETIME | ✅ |

### Categoria do Blog

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `nome` | VARCHAR(100) | ✅ |
| `slug` | VARCHAR(100) UNIQUE | ✅ |
| `cor` | VARCHAR(7) | ✅ |
| `ordem` | INT | ✅ |

---

## SEO

| Meta | Valor |
|------|-------|
| **Title (Lista)** | Blog — CraftSapiens \| Novidades e Atualizações |
| **Title (Post)** | [Título do Post] — CraftSapiens Blog |
| **Description (Post)** | [Resumo do post] |
| **OG Image (Post)** | Imagem de capa do post |
| **JSON-LD** | Article schema para posts individuais |
