# Página 09 — Perfil do Jogador

> **Rotas**: `/perfil`, `/perfil/compras`, `/perfil/configuracoes`
> **Acesso**: Logado (protegida)
> **Propósito**: Dashboard pessoal do jogador com progresso, dados, compras e configurações.

---

## Regras de Negócio

### RN-PERFIL-01: Dashboard Principal (`/perfil`)

#### Header do Perfil
- Avatar: Skin do Minecraft renderizada (via API `mc-heads.net` usando UUID)
- Username (nick do Minecraft)
- Badge de cargo/rank (Aluno, VIP, VIP+, Premium, Professor, Moderador, Admin)
- Badge de reputação do fórum
- Data de registro
- Último acesso no servidor
- Botão "Editar Perfil"

#### Cards de Resumo
Exibir 4-6 cards com métricas principais:
| Card | Dado | Fonte |
|------|------|-------|
| **Moedas SAPIENS** | Saldo atual | Tabela de economia do servidor |
| **XP Total** | Pontos de experiência | Tabela de XP do servidor |
| **Tempo Online** | Horas jogadas | Tabela de playtime |
| **Aulas Concluídas** | Quantidade | Tabela de progresso |
| **Ranking Geral** | Posição no ranking | Cálculo baseado em XP |
| **Plano Atual** | Gratuito/VIP/Premium + expiração | Tabela de permissões |

#### Atividade Recente

> **Implementação atual (v0.14):** `GET /api/perfil/atividade` junta compras aprovadas, tópicos, comentários e aulas concluídas do próprio usuário (10 mais recentes).
- Timeline com as últimas atividades:
  - Aulas assistidas
  - Compras realizadas
  - Posts no fórum
  - Conquistas desbloqueadas
- Máx 10 itens, com link "Ver mais"

#### Progresso de Aulas
- Barra de progresso por disciplina:
  ```
  Matemática    ████████░░░░  8/12 aulas (67%)
  Português     ██████░░░░░░  6/10 aulas (60%)
  História      ██░░░░░░░░░░  2/10 aulas (20%)
  ```
- Link "Ver todas" → expande lista completa

### RN-PERFIL-02: Histórico de Compras (`/perfil/compras`)
- Lista de todas as compras com:
  - Data
  - Produto (nome + imagem miniatura)
  - Valor pago
  - Método de pagamento (PIX, cartão, boleto)
  - Status: Aprovado | Pendente | Cancelado | Reembolsado
  - Botão "Ver detalhes" → modal com informações completas
- Filtros: por status, período, tipo de produto
- Se o plano VIP está ativo: exibir data de expiração e botão "Renovar"

### RN-PERFIL-03: Configurações da Conta (`/perfil/configuracoes`)

#### Dados Pessoais
- Email (editável, requer confirmação por email)
- Bio (texto livre, máx 500 caracteres)
- Data de nascimento (não editável após registro)

#### Alterar Senha
- Senha atual (obrigatória para validação)
- Nova senha + confirmar nova senha
- Validação: mesmas regras do registro
- Ao alterar: atualiza o hash na tabela nLogin (afeta o site e o servidor)

#### Notificações
| Notificação | Padrão | Opções |
|-------------|--------|--------|
| Respostas no fórum | Ligado | Email / Apenas no site / Desligado |
| Lembretes de aulas | Ligado | Email / Apenas no site / Desligado |
| Novidades e promoções | Desligado | Email / Desligado |
| Resumo semanal | Desligado | Email / Desligado |

#### Privacidade
- Perfil público no ranking: liga/desliga (toggle)
- Exibir tempo online: liga/desliga (toggle)
- Exibir atividade recente: liga/desliga (toggle)

#### Zona de Perigo
- **Desativar Conta**: Desativa conta no site (não deleta dados). Pode reativar fazendo login
- **Excluir Conta**: Solicitar exclusão permanente. Requer confirmação por email. Remove dados do site mas mantém dados do servidor Minecraft conforme termos
- Confirmação adicional: digitar username + "CONFIRMAR" para excluir

### RN-PERFIL-04: Perfil Público (`/jogador/[username]`)
- Versão pública do perfil de qualquer jogador
- Mostra apenas dados públicos:
  - Avatar (skin)
  - Username
  - Rank/cargo
  - Reputação do fórum
  - Data de registro
  - Estatísticas públicas (se configurado como público)
  - Posts recentes no fórum
- Não mostra: saldo de moedas, compras, email, configurações

---

## Wireframe Textual

### Dashboard (`/perfil`)

```
┌────────────────────────────────────────────────────────────────────┐
│ [NAVBAR — logado, com avatar no menu]                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌───────────────────────────────────────────────────────┐         │
│  │  ┌──────┐                                             │         │
│  │  │ SKIN │  SteveJogador123         [VIP+]             │         │
│  │  │ 3D   │  Membro desde Mar 2025   [Veterano]         │         │
│  │  │      │  Último acesso: Hoje 14:30                  │         │
│  │  └──────┘                         [Editar Perfil]     │         │
│  └───────────────────────────────────────────────────────┘         │
│                                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ 1.250    │ │ 8.430    │ │ 127h     │ │ 26       │               │
│  │ Moedas   │ │ XP Total │ │ Online   │ │ Aulas    │               │
│  │ SAPIENS  │ │          │ │          │ │ Concl.   │               │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                    │
│  ┌──────────┐ ┌──────────┐                                         │
│  │ #42      │ │ VIP+     │                                         │
│  │ Ranking  │ │ Expira   │                                         │
│  │ Geral    │ │ 15/04/26 │                                         │
│  └──────────┘ └──────────┘                                         │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  PROGRESSO DE AULAS                                                │
│                                                                    │
│  Matemática    ████████░░░░  8/12 (67%)                            │
│  Português     ██████░░░░░░  6/10 (60%)                            │
│  História      ██░░░░░░░░░░  2/10 (20%)                            │
│  Geografia     █████░░░░░░░  5/10 (50%)                            │
│  [Ver todas →]                                                     │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  ATIVIDADE RECENTE                                                 │
│                                                                    │
│  Hoje 14:30  — Entrou no servidor                                  │
│  Hoje 10:00  — Concluiu aula de Matemática (#8)                    │
│  Ontem       — Postou no fórum: "Melhor aula!"                     │
│  18/03       — Comprou VIP+ Mensal (R$ 29,90)                      │
│  17/03       — Atingiu 8.000 XP                                    │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [Minhas Compras]  [Configurações]  [Meu Ranking]                  │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└────────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

### Profile (extensão do User)

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | Sim |
| `user_id` | INT (FK, UNIQUE) | Sim |
| `bio` | VARCHAR(500) | Não |
| `avatar_url` | VARCHAR(255) | Não |
| `minecraft_uuid` | VARCHAR(36) | Não |
| `sapiens_coins` | INT | Sim |
| `xp_total` | INT | Sim |
| `playtime_minutes` | INT | Sim |
| `aulas_concluidas` | INT | Sim |
| `ranking_position` | INT | Não |
| `perfil_publico` | BOOLEAN | Sim |
| `mostrar_tempo_online` | BOOLEAN | Sim |
| `mostrar_atividade` | BOOLEAN | Sim |
| `updated_at` | DATETIME | Sim |

### Preferências de Notificação

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | Sim |
| `user_id` | INT (FK, UNIQUE) | Sim |
| `forum_respostas` | ENUM (email, site, off) | Sim |
| `lembretes_aulas` | ENUM (email, site, off) | Sim |
| `novidades` | ENUM (email, off) | Sim |
| `resumo_semanal` | ENUM (email, off) | Sim |

### Atividade

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | Sim |
| `user_id` | INT (FK) | Sim |
| `tipo` | ENUM (login_server, aula_concluida, post_forum, compra, conquista, xp_milestone) | Sim |
| `descricao` | VARCHAR(255) | Sim |
| `metadata` | JSON | Não |
| `created_at` | DATETIME | Sim |

---

## Sincronização com Servidor Minecraft

Os dados de XP, moedas, playtime e aulas são lidos diretamente das tabelas do servidor Minecraft. O site faz queries periódicas (cache de 5 min) para atualizar o perfil.

| Dado do Perfil | Tabela do Servidor | Campo |
|----------------|-------------------|-------|
| Moedas SAPIENS | Tabela de economia (plugin) | balance |
| XP Total | Tabela de XP (plugin) | experience |
| Playtime | Tabela de playtime (plugin) | time_played |
| Último login | Tabela nLogin | last_login |

---

## SEO

| Meta | Valor |
|------|-------|
| **Title** | Meu Perfil — CraftSapiens |
| **Robots** | noindex, nofollow (perfil privado) |
| **Title (público)** | [Username] — CraftSapiens |
