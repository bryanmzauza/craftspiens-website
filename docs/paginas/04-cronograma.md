# Página 04 — Cronograma / Grade Curricular

> **Rota**: `/cronograma`
> **Acesso**: Público (lançada na v0.23.1; antes só o grupo `dev` via o conteúdo)
> **Propósito**: Exibir horários de aulas, grade semanal e calendário de eventos.
> **Dados**: as aulas são marcadas pela equipe no painel (`/painel/cronograma`, ver [13-painel.md](./13-painel.md)) e lidas de `GET /api/cronograma?inicio=&fim=`, pública. Semana sem aulas mostra um link para o canal #cronograma-de-aulas do Discord.

---

## Regras de Negócio

### RN-CRONO-01: Hero da Página
- Título: "CRONOGRAMA" em fonte Minecraft
- Subtítulo: "Confira os horários das aulas e organize seus estudos."
- Breadcrumb: Home > Cronograma

### RN-CRONO-02: Visão Semanal (Padrão)
- Exibir um calendário semanal (segunda a domingo) com as aulas programadas
- Cada slot de aula deve mostrar:
  - Horário (início — fim)
  - Nome da disciplina
  - Nome do professor
  - Cor da disciplina (badge colorido)
  - Status: "Ao vivo agora" (se a aula estiver acontecendo), "Próxima", ou horário passado
- Layout tipo tabela/grid com colunas por dia da semana
- Dia atual destacado visualmente
- Aula ao vivo deve ter indicador pulsante (badge verde animado)

### RN-CRONO-03: Visão Mensal
- Toggle para alternar entre visão Semanal e Mensal
- Visão mensal mostra um calendário com:
  - Dias que têm aula marcados com ponto/badge
  - Clique no dia → expande para mostrar as aulas daquele dia
  - Navegação entre meses (← Anterior | Próximo →)

### RN-CRONO-04: Filtros
- Filtrar por:
  - **Disciplina**: Dropdown com todas as disciplinas
  - **Nível**: Fundamental I, Fundamental II, Ensino Médio, ENEM
  - **Professor**: Dropdown com professores
  - **Turno**: Manhã, Tarde, Noite
- Filtros refletem na URL (query params) para compartilhamento
- Botão "Limpar filtros"

### RN-CRONO-05: Detalhes da Aula (Modal/Sidebar)
- Ao clicar em uma aula no cronograma, abre um modal com:
  - Nome da aula e tema do dia
  - Professor, nível e local no jogo
  - Descrição da aula
  - Data e horário completos; aula cancelada aparece riscada, com o motivo
  - Endereço do servidor: `jogar.craftsapiens.com.br`
  - Botão "Adicionar à agenda": baixa um `.ics` da aula com lembrete 15 min antes (no lugar do lembrete por e-mail)
  - Botão "Ver disciplina" → `/aulas/[slug]`, quando a aula está ligada a uma disciplina

### RN-CRONO-06: Próximas Aulas (Widget)
- Sidebar ou seção mostrando as próximas 3-5 aulas em ordem cronológica
- Countdown timer para a próxima aula
- Atualização em tempo real (WebSocket ou polling a cada 60s)

### RN-CRONO-07: Exportar Calendário
- Botão para exportar a grade em `.ics` (Google Agenda, Outlook, Calendário da Apple), gerado no navegador
- Exporta o que está na tela: a semana ou o mês, com os filtros aplicados e sem as aulas canceladas
- Pendente: link de assinatura iCal

### RN-CRONO-08: Aviso de Férias / Recesso
- Aviso em texto livre no topo da página, publicado pelo painel, com data opcional para sair do ar
- Guardado em `site_settings` (chave `cronograma.aviso`)

---

## Wireframe Textual

```
┌────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                           │
├────────────────────────────────────────────────────────────────────┤
│  Home > Cronograma                                                 │
│                                                                    │
│  ████████████████████                                              │
│  █   CRONOGRAMA     █                                              │
│  ████████████████████                                              │
│  Confira os horários das aulas e organize seus estudos.            │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Filtrar: [Disciplina ▼] [Nível ▼] [Professor ▼] [Turno ▼]         │
│                                                                    │
│  Visão: [Semanal (ativa)] [Mensal]     [Exportar Calendário]       │
│                                                                    │
│  ← Semana anterior  |  19 - 25 Mar 2026  |  Próxima semana →       │
│                                                                    │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐                │
│  │ SEG  │ TER  │ QUA  │ QUI  │ SEX  │ SAB  │ DOM  │                │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤                │
│  │14:00 │      │14:00 │      │14:00 │10:00 │      │                │
│  │Matem.│      │Portu.│      │Histó.│Ciênc.│      │                │
│  │Prof. │      │Prof. │      │Prof. │Prof. │      │                │
│  │Camil.│      │Thaw. │      │Art.  │Wilt. │      │                │
│  │      │      │      │      │      │      │      │                │
│  │16:00 │15:00 │16:00 │15:00 │      │      │      │                │
│  │Físic.│Geog. │Quím. │ENEM  │      │      │      │                │
│  │Prof. │Prof. │Prof. │Prof. │      │      │      │                │
│  │Wilt. │Art.  │Camil.│Hel.  │      │      │      │                │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘                │
│                                                                    │
│  ┌──────────────────────────────────┐                              │
│  │  PRÓXIMAS AULAS                 │                              │
│  │                                  │                              │
│  │  ● Matemática — em 2h 30min      │                              │
│  │     Prof. Camilli | 14:00-15:30  │                              │
│  │                                  │                              │
│  │  ○ Português — Amanhã 14:00     │                              │
│  │     Prof. Thawana                │                              │
│  │                                  │                              │
│  │  ○ Geografia — Amanhã 15:00     │                              │
│  │     Prof. Arthur                 │                              │
│  └──────────────────────────────────┘                              │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└────────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

### scheduled_classes (v0.23)

Cada linha é uma aula com data e hora (não há regra de recorrência): "repetir por N semanas" no painel cria uma linha por semana, todas com o mesmo `series_id`. Assim cada semana pode ter o próprio tema, ser cancelada ou mudar de horário sem afetar as outras.

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | TEXT (PK) | Sim |
| `title` | VARCHAR(120) | Sim |
| `topic` | VARCHAR(200) | Não |
| `description` | TEXT | Não |
| `teacher` | VARCHAR(100) | Sim |
| `level` | VARCHAR(50) | Não |
| `color` | VARCHAR(20) | Sim |
| `location` | VARCHAR(100) | Não |
| `discipline_id` | TEXT (FK disciplines) | Não |
| `starts_at`, `ends_at` | TIMESTAMP | Sim |
| `cancelled`, `cancel_reason` | BOOLEAN, VARCHAR(200) | |
| `series_id` | TEXT | Não |
| `created_by` | VARCHAR(50) | Não (nome informado no painel) |

Lembrete por e-mail: não implementado; o `.ics` leva o lembrete para a agenda do aluno.

---

## SEO

| Meta | Valor |
|------|-------|
| **Title** | Cronograma de Aulas — CraftSapiens \| Grade Curricular |
| **Description** | Confira o cronograma completo de aulas gamificadas da CraftSapiens. Horários, disciplinas e professores. Organize seus estudos no Minecraft. |

---

## Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| **Desktop** | Tabela completa semanal com todos os dias visíveis |
| **Tablet** | Tabela com scroll horizontal ou visão de 3 dias |
| **Mobile** | Visão de 1 dia (swipe para navegar), lista vertical das aulas do dia |
