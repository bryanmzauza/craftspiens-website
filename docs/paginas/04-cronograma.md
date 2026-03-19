# 📅 Página 04 — Cronograma / Grade Curricular

> **Rota**: `/cronograma`
> **Acesso**: Público
> **Propósito**: Exibir horários de aulas, grade semanal e calendário de eventos.

---

## Regras de Negócio

### RN-CRONO-01: Hero da Página
- Título: **"CRONOGRAMA"** em fonte Minecraft
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
- Highlight no dia atual
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
- Ao clicar em uma aula no cronograma, abre um modal ou sidebar com:
  - Nome completo da disciplina
  - Professor com foto
  - Descrição da aula do dia
  - Horário completo
  - Link para entrar no servidor: `jogar.craftsapiens.com.br`
  - Botão "Adicionar lembrete" (se logado) — notificação por email 15min antes
  - Botão "Ver disciplina" → `/aulas/[slug]`

### RN-CRONO-06: Próximas Aulas (Widget)
- Sidebar ou seção mostrando as próximas 3-5 aulas em ordem cronológica
- Countdown timer para a próxima aula
- Atualização em tempo real (WebSocket ou polling a cada 60s)

### RN-CRONO-07: Exportar Calendário
- Botão para exportar grade em formato `.ics` (compatível com Google Calendar, Outlook, Apple Calendar)
- Opções:
  - Exportar semana atual
  - Exportar mês atual
  - Inscrever-se no calendário (link de assinatura iCal)

### RN-CRONO-08: Aviso de Férias / Recesso
- Se houver período de férias ou recesso, exibir banner informativo no topo:
  - "Período de férias: [data] a [data]. As aulas retornam em [data]."
- Dados configuráveis pelo admin

---

## Wireframe Textual

```
┌──────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                          │
├──────────────────────────────────────────────────────────────────┤
│  Home > Cronograma                                                 │
│                                                                    │
│  ████████████████████                                              │
│  █   CRONOGRAMA    █                                              │
│  ████████████████████                                              │
│  Confira os horários das aulas e organize seus estudos.            │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Filtrar: [Disciplina ▼] [Nível ▼] [Professor ▼] [Turno ▼]      │
│                                                                    │
│  Visão: [📅 Semanal ✓] [📆 Mensal]     [📥 Exportar Calendário]  │
│                                                                    │
│  ← Semana anterior  |  19 - 25 Mar 2026  |  Próxima semana →     │
│                                                                    │
│  ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐              │
│  │ SEG  │ TER  │ QUA  │ QUI  │ SEX  │ SAB  │ DOM  │              │
│  ├──────┼──────┼──────┼──────┼──────┼──────┼──────┤              │
│  │14:00 │      │14:00 │      │14:00 │10:00 │      │              │
│  │Matem.│      │Portu.│      │Histó.│Ciênc.│      │              │
│  │Prof. │      │Prof. │      │Prof. │Prof. │      │              │
│  │Camil.│      │Thaw. │      │Art.  │Wilt. │      │              │
│  │      │      │      │      │      │      │      │              │
│  │16:00 │15:00 │16:00 │15:00 │      │      │      │              │
│  │Físic.│Geog. │Quím. │ENEM  │      │      │      │              │
│  │Prof. │Prof. │Prof. │Prof. │      │      │      │              │
│  │Wilt. │Art.  │Camil.│Hel.  │      │      │      │              │
│  └──────┴──────┴──────┴──────┴──────┴──────┴──────┘              │
│                                                                    │
│  ┌──────────────────────────────────┐                              │
│  │  PRÓXIMAS AULAS                 │                              │
│  │                                  │                              │
│  │  🔴 Matemática — em 2h 30min    │                              │
│  │     Prof. Camilli | 14:00-15:30  │                              │
│  │                                  │                              │
│  │  ○ Português — Amanhã 14:00     │                              │
│  │     Prof. Thawana                │                              │
│  │                                  │                              │
│  │  ○ Geografia — Amanhã 15:00     │                              │
│  │     Prof. Arthur                 │                              │
│  └──────────────────────────────────┘                              │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

### Aula Agendada (Schedule)

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `disciplina_id` | INT (FK) | ✅ |
| `professor_id` | INT (FK) | ✅ |
| `titulo` | VARCHAR(200) | ❌ |
| `descricao` | TEXT | ❌ |
| `dia_semana` | ENUM (seg, ter, qua, qui, sex, sab, dom) | ✅ |
| `hora_inicio` | TIME | ✅ |
| `hora_fim` | TIME | ✅ |
| `nivel` | VARCHAR(50) | ✅ |
| `recorrente` | BOOLEAN | ✅ |
| `data_especifica` | DATE | ❌ |
| `ativo` | BOOLEAN | ✅ |
| `created_at` | DATETIME | ✅ |

### Lembrete

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `user_id` | INT (FK) | ✅ |
| `schedule_id` | INT (FK) | ✅ |
| `notificar_minutos_antes` | INT | ✅ |
| `email_enviado` | BOOLEAN | ✅ |

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
