# 💬 Página 06 — Comunidade (Fórum)

> **Rota**: `/comunidade`, `/comunidade/[categoria]`, `/comunidade/[categoria]/[topico]`
> **Acesso**: Público (leitura) / Logado (participar)
> **Propósito**: Fórum da comunidade para discussões, dúvidas e interação entre alunos, professores e staff.

---

## Regras de Negócio

### RN-FORUM-01: Hero da Página
- Título: **"COMUNIDADE"** em fonte Minecraft
- Subtítulo: "Participe das discussões, tire dúvidas e conecte-se com outros jogadores."
- Breadcrumb: Home > Comunidade
- Barra de busca global do fórum em destaque

### RN-FORUM-02: Categorias
- Página principal (`/comunidade`) exibe lista de categorias:
  - **Geral** — Discussões livres sobre a CraftSapiens
  - **Dúvidas de Aulas** — Perguntas sobre disciplinas e conteúdos
  - **Sugestões** — Ideias para o servidor e plataforma
  - **Bugs & Problemas** — Reportar bugs do servidor ou site
  - **Showroom** — Compartilhar construções, conquistas, screenshots
  - **Off-Topic** — Assuntos gerais fora do tema
  - **Anúncios** (somente staff) — Novidades oficiais
- Cada categoria mostra:
  - Ícone/emoji
  - Nome e descrição
  - Quantidade de tópicos
  - Quantidade de posts/comentários
  - Último post (título + autor + tempo)
- Categorias são gerenciáveis pelo admin

### RN-FORUM-03: Lista de Tópicos (`/comunidade/[categoria]`)
- Exibir tópicos da categoria selecionada
- Cada tópico mostra:
  - Título
  - Autor (avatar skin Minecraft + username)
  - Data de criação
  - Quantidade de comentários
  - Quantidade de visualizações
  - Badge: "Fixado", "Fechado", "Resolvido"
  - Tag de destaque se for staff/professor
- Ordenação: Fixados primeiro, depois por última atividade
- Paginação: 20 tópicos por página
- Botão "NOVO TÓPICO" (requer login)

### RN-FORUM-04: Tópico e Comentários (`/comunidade/[categoria]/[topico]`)
- Post original (OP):
  - Título
  - Conteúdo formatado (Markdown básico: bold, italic, links, imagens, código)
  - Autor com avatar, username, cargo, reputação, data de registro
  - Data de postagem
  - Botões: Curtir (👍), Descurtir (👎), Reportar (🚩), Compartilhar (🔗)
- Comentários:
  - Mesma estrutura do OP mas sem título
  - Suporte a respostas aninhadas (1 nível de profundidade)
  - Ordenação: cronológica (mais antigo primeiro)
  - Paginação: 30 comentários por página
- Editor de resposta:
  - Textarea com toolbar Markdown (bold, italic, link, imagem, código)
  - Preview do post antes de enviar
  - Botão "RESPONDER" (requer login)

### RN-FORUM-05: Criação de Tópico (Logado)
- Formulário:
  - Categoria (dropdown, pré-selecionada se veio de uma categoria)
  - Título (máx 200 caracteres)
  - Conteúdo (Markdown, mín 20 caracteres)
  - Tags opcionais (máx 5)
- Validações:
  - Não pode criar tópico duplicado (mesmo título na mesma categoria em 24h)
  - Rate limit: máx 5 tópicos por hora por usuário
  - Anti-spam: requer conta com mais de 1h de criação
- Preview antes de publicar

### RN-FORUM-06: Sistema de Reputação
- Cada usuário tem um score de reputação calculado por:
  - +1 por tópico criado
  - +1 por comentário feito
  - +2 por like recebido em tópico
  - +1 por like recebido em comentário
  - -1 por dislike recebido
- Reputação é exibida no perfil e ao lado do username nos posts
- Badges de reputação:
  - 🌱 Novato (0-10)
  - ⭐ Membro (11-50)
  - 🏆 Veterano (51-200)
  - 💎 Lenda (201+)

### RN-FORUM-07: Moderação
- Moderadores e admins podem:
  - Fixar/desfixar tópicos
  - Fechar/reabrir tópicos
  - Marcar como "Resolvido"
  - Editar/remover posts de qualquer usuário
  - Mover tópicos entre categorias
  - Banir usuários do fórum (temporário ou permanente)
- Usuários podem:
  - Editar seus próprios posts (dentro de 30 min após publicação)
  - Deletar seus próprios posts (se não tiver respostas)
  - Reportar posts (botão de denúncia → notifica moderadores)

### RN-FORUM-08: Busca
- Campo de busca global que pesquisa em:
  - Títulos de tópicos
  - Conteúdo de posts
  - Username de autores
- Filtros de busca: Categoria, Autor, Data, Resolvido/Não resolvido
- Resultados com highlight do termo buscado

### RN-FORUM-09: Notificações (Logado)
- Usuário recebe notificações quando:
  - Alguém responde ao seu tópico
  - Alguém responde ao seu comentário
  - Seu post recebe like
  - Mencionado em um post (@username)
- Notificações visíveis no ícone do sino na navbar
- Opção de notificação por email (configurável no perfil)

---

## Wireframe Textual

### Categorias (`/comunidade`)

```
┌──────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                          │
├──────────────────────────────────────────────────────────────────┤
│  Home > Comunidade                                                 │
│                                                                    │
│  ████████████████████                                              │
│  █   COMUNIDADE    █                                              │
│  ████████████████████                                              │
│                                                                    │
│  🔍 [Buscar no fórum...                              ] [BUSCAR]  │
│                                                                    │
│  ┌────────────────────────────────────────────────────────┐       │
│  │ 📢 Anúncios          12 tópicos  |  Último: "Manu..." │       │
│  │    Novidades oficiais da CraftSapiens                   │       │
│  ├────────────────────────────────────────────────────────┤       │
│  │ 💬 Geral              87 tópicos  |  Último: "Algu..." │       │
│  │    Discussões livres                                    │       │
│  ├────────────────────────────────────────────────────────┤       │
│  │ ❓ Dúvidas de Aulas    45 tópicos  |  Último: "Como..." │       │
│  │    Perguntas sobre disciplinas                          │       │
│  ├────────────────────────────────────────────────────────┤       │
│  │ 💡 Sugestões           23 tópicos  |  Último: "Seri..." │       │
│  │    Ideias para melhoria                                 │       │
│  ├────────────────────────────────────────────────────────┤       │
│  │ 🐛 Bugs & Problemas    15 tópicos  |  Último: "Erro..." │       │
│  │    Reportar problemas                                   │       │
│  ├────────────────────────────────────────────────────────┤       │
│  │ 🏗️ Showroom            34 tópicos  |  Último: "Minh..." │       │
│  │    Compartilhe construções e conquistas                  │       │
│  ├────────────────────────────────────────────────────────┤       │
│  │ 🎮 Off-Topic           56 tópicos  |  Último: "Você..." │       │
│  │    Assuntos gerais                                      │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                    │
│  📊 Estatísticas: 272 tópicos | 1.430 comentários | 523 membros  │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Tópicos (`/comunidade/[categoria]`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Home > Comunidade > Geral                                         │
│                                                                    │
│  💬 GERAL                              [+ NOVO TÓPICO]            │
│                                                                    │
│  ┌────────────────────────────────────────────────────────┐       │
│  │ 📌 Regras do Fórum            Staff  |  32 respostas  │       │
│  ├────────────────────────────────────────────────────────┤       │
│  │ 📌 Bem-vindos à Comunidade!   Staff  |  15 respostas  │       │
│  ├────────────────────────────────────────────────────────┤       │
│  │ Como ganhar mais XP?     joao123  |  5 resp | 2h atrás  │       │
│  ├────────────────────────────────────────────────────────┤       │
│  │ Melhor aula da semana!   maria_mc |  12 resp | 5h atrás │       │
│  ├────────────────────────────────────────────────────────┤       │
│  │ Alguém quer jogar?       pedro99  |  3 resp | 1d atrás  │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                    │
│  Página: [1] [2] [3] ... [5]                                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

### Categoria do Fórum

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `nome` | VARCHAR(100) | ✅ |
| `slug` | VARCHAR(100) UNIQUE | ✅ |
| `descricao` | VARCHAR(255) | ✅ |
| `icone` | VARCHAR(50) | ✅ |
| `ordem` | INT | ✅ |
| `somente_staff` | BOOLEAN | ✅ |
| `ativo` | BOOLEAN | ✅ |

### Tópico

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `categoria_id` | INT (FK) | ✅ |
| `autor_id` | INT (FK) | ✅ |
| `titulo` | VARCHAR(200) | ✅ |
| `conteudo` | TEXT | ✅ |
| `slug` | VARCHAR(250) UNIQUE | ✅ |
| `fixado` | BOOLEAN | ✅ |
| `fechado` | BOOLEAN | ✅ |
| `resolvido` | BOOLEAN | ✅ |
| `views` | INT | ✅ |
| `likes` | INT | ✅ |
| `dislikes` | INT | ✅ |
| `tags` | JSON | ❌ |
| `created_at` | DATETIME | ✅ |
| `updated_at` | DATETIME | ✅ |
| `last_activity_at` | DATETIME | ✅ |

### Comentário

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `topico_id` | INT (FK) | ✅ |
| `autor_id` | INT (FK) | ✅ |
| `parent_id` | INT (FK, nullable) | ❌ |
| `conteudo` | TEXT | ✅ |
| `likes` | INT | ✅ |
| `dislikes` | INT | ✅ |
| `created_at` | DATETIME | ✅ |
| `updated_at` | DATETIME | ✅ |

### Reação

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `user_id` | INT (FK) | ✅ |
| `topico_id` | INT (FK, nullable) | ❌ |
| `comentario_id` | INT (FK, nullable) | ❌ |
| `tipo` | ENUM (like, dislike) | ✅ |
| `created_at` | DATETIME | ✅ |

> **Constraint**: UNIQUE(user_id, topico_id) e UNIQUE(user_id, comentario_id) — 1 reação por post por usuário.

### Report (Denúncia)

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `reporter_id` | INT (FK) | ✅ |
| `topico_id` | INT (FK, nullable) | ❌ |
| `comentario_id` | INT (FK, nullable) | ❌ |
| `motivo` | TEXT | ✅ |
| `status` | ENUM (pendente, resolvido, ignorado) | ✅ |
| `resolved_by` | INT (FK, nullable) | ❌ |
| `created_at` | DATETIME | ✅ |

---

## Segurança

- Sanitização de Markdown (prevenir XSS — usar lib como `dompurify` + `marked`)
- Rate limiting em criação de tópicos e comentários
- Anti-spam: contas novas (< 1h) não podem postar
- Upload de imagens: validar tipo MIME, tamanho máximo (2MB), armazenar em bucket seguro
- Moderação: logs de todas as ações de moderação

---

## SEO

| Meta | Valor |
|------|-------|
| **Title** | Comunidade — CraftSapiens \| Fórum |
| **Description** | Participe da comunidade CraftSapiens. Discuta, tire dúvidas e compartilhe suas conquistas com outros alunos e professores do Minecraft educacional. |
