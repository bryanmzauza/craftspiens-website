# Página 03 — Aulas

> **Rota**: `/aulas` e `/aulas/[slug]`
> **Acesso**: Público (catálogo) / Logado (conteúdo detalhado)
> **Propósito**: Mostrar as disciplinas disponíveis e como funcionam as aulas gamificadas.

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
- Grid de cards mostrando todas as disciplinas disponíveis
- Cada card deve conter:
  - Ícone/imagem temática da disciplina
  - Nome da disciplina (ex: Matemática, Português, História, Geografia, Ciências, Física, Química)
  - Breve descrição (1-2 linhas)
  - Nível(is): Fundamental / Médio / ENEM
  - Quantidade de aulas disponíveis
  - Badge de nível (cor diferente por nível)
- Clique no card → vai para `/aulas/[slug]` (detalhe da disciplina)

### RN-AULAS-04: Filtros
- Filtrar disciplinas por:
  - **Nível**: Fundamental I, Fundamental II, Ensino Médio, ENEM
  - **Disciplina**: Dropdown ou tags clicáveis
  - **Busca por texto**: Campo de busca
- Filtros aplicados via URL query params (compartilhável)
- Exibir quantidade de resultados

### RN-AULAS-05: Página de Detalhe da Disciplina (`/aulas/[slug]`)
- Informações completas da disciplina:
  - Nome completo
  - Descrição detalhada
  - Professor(es) responsável(is) com foto e mini-bio
  - Lista de aulas/tópicos (curriculum)
  - Screenshots e/ou vídeos de aulas anteriores
  - Nível de dificuldade
  - Pré-requisitos (se houver)
- CTA: "ASSISTIR AULAS" → Se não logado, redireciona para `/registro`
- Seção de FAQ por disciplina

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
│  Filtrar: [Todos ▼] [Fundamental ▼] [Médio ▼] [ENEM ▼] [Buscar__]  │
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

### Disciplina

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | Sim |
| `nome` | VARCHAR(100) | Sim |
| `slug` | VARCHAR(100) UNIQUE | Sim |
| `descricao` | TEXT | Sim |
| `descricao_curta` | VARCHAR(255) | Sim |
| `icone` | VARCHAR(255) | Sim |
| `banner` | VARCHAR(255) | Não |
| `niveis` | JSON (array de strings) | Sim |
| `total_aulas` | INT | Sim |
| `professor_ids` | JSON (array de IDs) | Sim |
| `ativo` | BOOLEAN | Sim |
| `created_at` | DATETIME | Sim |
| `updated_at` | DATETIME | Sim |

### Aula (Tópico)

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | Sim |
| `disciplina_id` | INT (FK) | Sim |
| `titulo` | VARCHAR(200) | Sim |
| `descricao` | TEXT | Sim |
| `ordem` | INT | Sim |
| `duracao_minutos` | INT | Não |
| `ativo` | BOOLEAN | Sim |

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
