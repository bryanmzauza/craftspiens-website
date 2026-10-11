# Página 10 — Status do Servidor & Rankings

> **Rota**: `/status`
> **Acesso**: Público
> **Propósito**: Exibir status em tempo real do servidor Minecraft e rankings dos jogadores.

---

## Regras de Negócio

### RN-STATUS-01: Hero da Página
- Título: "STATUS DO SERVIDOR" em fonte Minecraft
- Subtítulo: "Acompanhe o servidor em tempo real."
- Breadcrumb: Home > Status

### RN-STATUS-02: Status do Servidor (Tempo Real)
> Implementação atual (v0.15): o painel mostra status, jogadores (atual/máximo), faixa de versões Java aceitas e as edições aceitas. Logo abaixo, a seção "Como entrar" traz o acesso para Java Edition (`jogar.craftsapiens.com.br`, porta resolvida pelo registro SRV) e Bedrock Edition (mesmo endereço, porta 19132), com botões de copiar e o passo a passo de cada edição. O status é consultado diretamente no servidor (Server List Ping) e atualizado a cada 15 s nesta página.
- Painel principal exibindo:
  | Dado | Fonte | Atualização |
  |------|-------|-------------|
  | **Status** | Online / Offline | A cada 15 segundos |
  | **Jogadores Online** | X / Máx (ex: 42/200) | A cada 15 segundos |
  | **Versão** | Ex: 1.20.4 | Server List Ping |
  | **IP do Servidor** | `jogar.craftsapiens.com.br` | Estático |
  | **Latência** | Ping em ms | A cada 15 segundos |
  | **Uptime** | Tempo desde o último restart | A cada 1 minuto |

- Indicador visual grande e centralizado:
  - ONLINE (indicador verde pulsante), com contador de jogadores animado
  - OFFLINE (indicador vermelho), com a mensagem "Servidor em manutenção"
- Botão "COPIAR IP" ao lado do endereço do servidor

### RN-STATUS-03: Lista de Jogadores Online
- Se o servidor estiver online:
  - Grid com os jogadores conectados no momento
  - Cada jogador: skin avatar (head) + username
  - Total de jogadores no topo
  - Atualiza a cada 30 segundos
- Se o servidor estiver offline: mensagem informativa

### RN-STATUS-04: Gráfico de Jogadores
- Gráfico de linha mostrando a quantidade de jogadores nas últimas 24h
- Intervalos de 15 minutos
- Pico de jogadores destacado
- Gráfico interativo (hover mostra horário + contagem)
- Opção de ver: Últimas 24h | Últimos 7 dias | Último mês

### RN-STATUS-05: Rankings

> **Implementação atual (v0.14):** apenas **Top Aulas Concluídas**, via `GET /api/ranking` (contas ativas com perfil público). XP, moedas e tempo online ainda não são sincronizados do servidor, então esses rankings ficam ocultos até existir essa integração.
- Seção com múltiplos rankings em tabs ou cards:

#### Top XP (Experiência)
| # | Jogador | XP | Nível |
|---|---------|-----|-------|
| 1 | SteveJogador | 15.430 | Lenda |
| 2 | Maria_MC | 12.100 | Veterano |
| 3 | Pedro99 | 9.800 | Veterano |
| 4 | ... | ... | ... |

#### Top Moedas SAPIENS
| # | Jogador | Moedas |
|---|---------|--------|
| 1 | ... | 5.200 |
| ... | ... | ... |

#### Top Tempo Online
| # | Jogador | Horas |
|---|---------|-------|
| 1 | ... | 340h |
| ... | ... | ... |

#### Top Aulas Concluídas
| # | Jogador | Aulas |
|---|---------|-------|
| 1 | ... | 28 |
| ... | ... | ... |

- Cada ranking exibe top 10 (com link "Ver ranking completo")
- Avatar (head skin) ao lado do username
- Jogador logado: sua posição destacada no ranking (mesmo fora do top 10)
- Atualização: cache de 5 minutos

### RN-STATUS-06: Ranking Completo (Expansível)
- Ao clicar "Ver ranking completo": expande para tabela completa
- Paginação: 50 jogadores por página
- Busca por username
- Se logado: highlight na posição do jogador

### RN-STATUS-07: Meu Ranking (Logado)
- Card com a posição do jogador logado em cada ranking
- "Você está em #42 no ranking de XP | #15 no ranking de Moedas"
- Link para o perfil

---

## Wireframe Textual

```
┌────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                           │
├────────────────────────────────────────────────────────────────────┤
│  Home > Status                                                     │
│                                                                    │
│  ██████████████████████████████                                    │
│  █  STATUS DO SERVIDOR       █                                     │
│  ██████████████████████████████                                    │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌────────────────────────────────────────────────────────┐        │
│  │                                                        │        │
│  │           ● SERVIDOR ONLINE                            │        │
│  │                                                        │        │
│  │     42 / 200 jogadores online                          │        │
│  │                                                        │        │
│  │  IP: jogar.craftsapiens.com.br  [COPIAR IP]            │        │
│  │  Versão: 1.20.4  |  Ping: 23ms  |  Uptime: 14d 3h      │        │
│  │                                                        │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  JOGADORES ONLINE (42)                                             │
│                                                                    │
│  [Steve] [Maria] [Pedro] [João] [Ana]                              │
│  [Lucas] [Julia] [Rafael] [Camila] ...                             │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  JOGADORES NAS ÚLTIMAS 24H                                         │
│                                                                    │
│  50│     ╱╲                                                        │
│  40│    ╱  ╲      ╱╲                                               │
│  30│   ╱    ╲    ╱  ╲                                              │
│  20│──╱      ╲──╱    ╲──                                           │
│  10│─╱                  ╲─                                         │
│   0│──────────────────────                                         │
│    00:00  06:00  12:00  18:00   Agora                              │
│                                                                    │
│  [24h] [7 dias] [30 dias]                                          │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│  RANKINGS                                                          │
│                                                                    │
│  [XP] [Moedas] [Tempo Online] [Aulas]                              │
│                                                                    │
│  ┌────────────────────────────────────────────────────────┐        │
│  │ # │  Jogador              │  XP       │  Nível         │        │
│  │───┼───────────────────────┼───────────┼────────────────│        │
│  │ 1 │  [img] SteveJogador   │  15.430   │  Lenda         │        │
│  │ 2 │  [img] Maria_MC       │  12.100   │  Veterano      │        │
│  │ 3 │  [img] Pedro99        │   9.800   │  Veterano      │        │
│  │ 4 │  [img] JoaoGamer      │   8.200   │  Veterano      │        │
│  │ 5 │  [img] AnaBuilder     │   7.500   │  Membro        │        │
│  │...│  ...                  │  ...      │  ...           │        │
│  │───┼───────────────────────┼───────────┼────────────────│        │
│  │ 42│  [img] VOCÊ (destaque)│   3.210   │  Membro        │        │
│  └────────────────────────────────────────────────────────┘        │
│                                                                    │
│  [Ver ranking completo →]                                          │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└────────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### `GET /api/server-status`
- Retorna: status, jogadores online/max, versão, latência, MOTD
- Cache: 15 segundos
- Fonte: Minecraft Server List Ping (TCP port 25565)

### `GET /api/server-status/players`
- Retorna: lista de jogadores online com UUID e username
- Cache: 30 segundos

### `GET /api/server-status/history?period=24h|7d|30d`
- Retorna: histórico de contagem de jogadores
- Cache: 5 minutos

### `GET /api/rankings?type=xp|moedas|playtime|aulas&page=1&limit=50`
- Retorna: lista ranqueada de jogadores
- Cache: 5 minutos

---

## Modelo de Dados

### Histórico de Status

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | BIGINT (PK) | Sim |
| `online` | BOOLEAN | Sim |
| `players_online` | INT | Sim |
| `players_max` | INT | Sim |
| `latency_ms` | INT | Não |
| `recorded_at` | DATETIME | Sim |

> Registrar a cada 5 minutos. Purgar dados com mais de 90 dias.

---

## SEO

| Meta | Valor |
|------|-------|
| **Title** | Status do Servidor — CraftSapiens \| Jogadores Online & Rankings |
| **Description** | Veja o status em tempo real do servidor CraftSapiens. Jogadores online, rankings de XP, moedas SAPIENS e mais. IP: jogar.craftsapiens.com.br |
