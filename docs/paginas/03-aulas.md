# Página 03 — Aulas

> **Rota**: `/aulas`, `/aulas/[slug]` e `/aulas/[slug]/[lessonSlug]`
> **Acesso**: Público (o progresso exige login)
> **Propósito**: Mostrar como funcionam as aulas gamificadas e reunir, por disciplina, os vídeos e lives públicos do canal da Craftsapiens no YouTube.

---

## Regras de Negócio

### RN-AULAS-01: Hero da Página
- Título: "AULAS GAMIFICADAS" em fonte Minecraft
- Subtítulo: "Aprenda de verdade, jogando de verdade."
- Breadcrumb: Home > Aulas
- Background com screenshot de uma sala de aula dentro do Minecraft

### RN-AULAS-02: Explicação do Método
- Seção explicando como funcionam as aulas na CraftSapiens:
  - Aulas acontecem dentro do servidor Minecraft online
  - Professores usam quadro funcional programado em Java dentro do jogo
  - Cada aula tem minigames temáticos relacionados ao conteúdo
  - Construções e aulas de campo temáticas por disciplina
  - Não requer mods — funciona com Minecraft nativo (Java Edition)
- Vídeo demonstrativo ou galeria de screenshots das aulas
- Texto de destaque na página: "10x mais envolvente que aulas convencionais"

### RN-AULAS-03: Catálogo de Disciplinas
- Grid de cards com as disciplinas ativas, na ordem definida em `scripts/lib/youtube-aulas.mjs`
- Cada card contém: ícone (Lucide) na cor da disciplina, nome, descrição curta, área e "N aulas · X h de conteúdo"
- Clique no card → `/aulas/[slug]`
- Acima do catálogo, a seção **Aulas recentes** mostra os 8 últimos vídeos publicados (`GET /api/aulas/recentes`), sem repetir o mesmo vídeo em duas disciplinas e sem o conteúdo de "Servidor e Comunidade"

### RN-AULAS-04: Filtros
- **Área**: Todas, Exatas, Natureza, Humanas, Linguagens, Outras (`GET /api/aulas?area=`)
- **Busca por texto** no nome e na descrição curta, sem diferenciar maiúsculas (`GET /api/aulas?busca=`)

### RN-AULAS-05: Página da Disciplina (`/aulas/[slug]`)
- Descrição, área, total de aulas (por formato), horas de conteúdo, período (primeiro e último ano) e progresso do aluno logado
- Grade de vídeos: miniatura do YouTube, formato (Live, Vídeo, Vídeo curto), duração, data e selo "Concluída"
- Busca pelo título (sem diferenciar maiúsculas e acentos), filtro por formato, ordem "Mais recentes" ou "Mais antigas" e botão "Mostrar mais" a cada 24 vídeos
- CTA para o cronograma (logado) ou cadastro

### RN-AULAS-05.1: Página da Aula (`/aulas/[slug]/[lessonSlug]`)
- Vídeo incorporado de `youtube-nocookie.com`, título, disciplina, formato e data de transmissão
- Descrição gerada pelo seed e link "Assistir no YouTube"
- Navegação para a aula anterior e a próxima em ordem cronológica
- Botão para marcar como concluída (logado)

### RN-AULAS-06: Seção ENEM & Reforço
- Bloco dedicado à preparação para o ENEM
- Conteúdo programático alinhado ao ENEM
- Simulados e exercícios gamificados
- Estatísticas de desempenho (se logado)
- Card próprio com badge "ENEM"

### RN-AULAS-07: Seção "Para Pais"
- Bloco informativo direcionado aos pais:
  - Como acompanhar o progresso do filho
  - Segurança do ambiente (servidor monitorado)
  - Resultados e depoimentos de outros pais
  - Link para contato/WhatsApp para tirar dúvidas

### RN-AULAS-08: Origem dos vídeos
- Os vídeos vêm das abas Vídeos e Ao vivo de https://www.youtube.com/@craftsapiens
- `npm run aulas:youtube` (`scripts/youtube-sync.mjs`) lista os vídeos com o yt-dlp (títulos em português) e grava `scripts/data/youtube-videos.json` com id, título, formato, duração e data de publicação. Vídeos da aba Vídeos com até 3 minutos são marcados como "curto"
- `npm run db:seed:aulas` lê esse arquivo, classifica cada vídeo e grava disciplinas e aulas. Aulas e disciplinas que saem da lista são desativadas, sem apagar o progresso
- Classificação (`scripts/lib/youtube-aulas.mjs`):
  - A matéria é lida da parte do título que a indica ("Aula de **Química** no Minecraft", "Aula no Minecraft: **Física** - vetores"); se não houver, o título inteiro é comparado com as palavras-chave de cada disciplina
  - Um vídeo pode entrar em mais de uma disciplina (ex.: "Inglês/Espanhol"); títulos com ENEM, simulado, vestibulares militares ou OBA também entram em "ENEM e Vestibulares"
  - Lives publicadas com título genérico ("[LIVE] Aula no Minecraft") usam o título transcrito da miniatura do vídeo (`scripts/lib/youtube-titulos.mjs`), que traz a matéria e quase sempre o tema; esse título é exibido no site e usado na classificação. Das 168 lives nessa situação, 158 foram transcritas; as 10 com miniatura sem texto ficam em "Outras Aulas"
  - Tutoriais, eventos e gameplay vão para "Servidor e Comunidade"
  - `OVERRIDES` corrige ou completa a classificação de um vídeo pelo id: `{ "<id>": ["quimica"] }` soma a disciplina; `{ "<id>": ["=servidor-comunidade"] }` substitui a classificação
- Para atualizar o site com vídeos novos: `npm run aulas:atualizar` (sync e seed em sequência). Em produção, um timer do systemd roda esse comando a cada 3 horas (ver `docs/arquitetura-producao.md`, seção 6.5); a lista é gravada no arquivo de `AULAS_YOUTUBE_FILE`, fora do repositório
- Proteções do sync: lives em andamento ou agendadas são ignoradas; se a lista vier com menos de 80% dos vídeos anteriores, nada é gravado (use `--forcar` para aceitar); se a data de um vídeo novo não puder ser consultada, ele entra com a data da sincronização e é consultado de novo na próxima

---

## Wireframe Textual

### Página de Catálogo (`/aulas`)

```
┌────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Home > Aulas                                                      │
│                                                                    │
│  ████████████████████████████                                      │
│  █  AULAS GAMIFICADAS       █                                      │
│  ████████████████████████████                                      │
│  Aprenda de verdade, jogando de verdade.                           │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                     COMO FUNCIONAM AS AULAS                        │
│                                                                    │
│  [Texto explicativo]            [Vídeo / Screenshots]              │
│  • Aulas no Minecraft online                                       │
│  • Quadro funcional no jogo                                        │
│  • Minigames temáticos                                             │
│  • Sem mods necessários                                            │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [Buscar__]  [Todas] [Exatas] [Natureza] [Humanas] [Linguagens] .. │
│                                                                    │
│  12 disciplinas encontradas                                        │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ [Ícone]      │  │ [Ícone]      │  │ [Ícone]      │              │
│  │              │  │              │  │              │              │
│  │ Matemática   │  │ Português    │  │ Geografia    │              │
│  │ Fund. / Méd. │  │ Fund. / Méd. │  │ Fund. / Méd. │              │
│  │ 12 aulas     │  │ 10 aulas     │  │ 8 aulas      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ [Ícone]      │  │ [Ícone]      │  │ [Ícone]      │              │
│  │              │  │              │  │              │              │
│  │ Ciências     │  │ História     │  │ Física       │              │
│  │ Fundamental  │  │ Fund. / Méd. │  │ Ens. Médio   │              │
│  │ 8 aulas      │  │ 10 aulas     │  │ 6 aulas      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                    ENEM & REFORÇO                                  │
│                                                                    │
│  Preparação gamificada para o ENEM.                                │
│  [Saiba mais →]                                                    │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                    PARA PAIS                                       │
│                                                                    │
│  Acompanhe o progresso do seu filho em um                          │
│  ambiente seguro e monitorado.                                     │
│  [Falar com equipe →]                                              │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└────────────────────────────────────────────────────────────────────┘
```

### Página de Detalhe (`/aulas/[slug]`)

```
┌────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Home > Aulas > Matemática                                         │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │  [Banner da disciplina — screenshot do Minecraft]       │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                    │
│  MATEMÁTICA                    Nível: Fundamental / Médio          │
│                                12 aulas disponíveis                │
│                                                                    │
│  [Descrição completa da disciplina, metodologia aplicada,          │
│   como são os minigames e construções temáticas...]                │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  PROFESSOR(ES)                                                     │
│                                                                    │
│  ┌────┐  Prof. Marcelo Camilli                                     │
│  │foto│  Formado em Matemática pela UFPR...                        │
│  └────┘                                                            │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  CONTEÚDO PROGRAMÁTICO                                             │
│                                                                    │
│  [x] Aula 01 — Introdução à Álgebra                                │
│  [x] Aula 02 — Equações do 1º grau                                 │
│  [ ] Aula 03 — Equações do 2º grau                                 │
│  [ ] Aula 04 — Funções                                             │
│  ... (lista completa)                                              │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  GALERIA                                                           │
│                                                                    │
│  [Screenshot 1] [Screenshot 2] [Vídeo]                             │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│              ┌──────────────────────┐                              │
│              │   ASSISTIR AULAS     │                              │
│              └──────────────────────┘                              │
├────────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└────────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

Tabelas `disciplines` e `lessons` em `prisma/schema.pg.prisma`.

### Disciplina (`disciplines`)

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | TEXT (PK) | Sim |
| `name` | VARCHAR(100) | Sim |
| `slug` | VARCHAR(100) UNIQUE | Sim |
| `description` | TEXT | Sim |
| `short_description` | VARCHAR(255) | Sim |
| `icon` | VARCHAR(50), nome do ícone do Lucide | Sim |
| `color` | VARCHAR(20) | Sim |
| `banner` | VARCHAR(500) | Não |
| `area` | VARCHAR(40) | Sim |
| `levels` | VARCHAR(100), legado, sem uso na interface | Sim |
| `order` | INT | Sim |
| `active` | BOOLEAN | Sim |

### Aula (`lessons`)

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | TEXT (PK), `yt-<disciplina>-<id do vídeo>` nas aulas do YouTube | Sim |
| `discipline_id` | TEXT (FK) | Sim |
| `title` | VARCHAR(200) | Sim |
| `slug` | VARCHAR(200), único por disciplina | Sim |
| `description` | TEXT | Sim |
| `video_url` | VARCHAR(500), URL de incorporação | Não |
| `youtube_id` | VARCHAR(20) | Não |
| `format` | VARCHAR(10): `live`, `video` ou `curto` | Não |
| `published_at` | TIMESTAMP | Não |
| `order` | INT, ordem cronológica na disciplina | Sim |
| `duration_minutes` | INT | Não |
| `active` | BOOLEAN | Sim |

---

## SEO

| Meta | Valor |
|------|-------|
| **Title** | Aulas Gamificadas — CraftSapiens \| Aprenda Jogando Minecraft |
| **Description** | Conheça as aulas gamificadas da CraftSapiens. Matemática, Português, História e mais, tudo dentro do Minecraft. Ensino fundamental, médio e preparação ENEM. |

---

## Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| **Desktop** | Grid 3 colunas para cards, texto + mídia lado a lado |
| **Tablet** | Grid 2 colunas, filtros em linha |
| **Mobile** | Coluna única, filtros em dropdown/modal, cards full-width |
