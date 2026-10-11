# CraftSapiens — Website

> **"Construa Seu Futuro Jogando"**
>
> O Maior Metaverso Educacional do Mundo. Aulas reais, gamificação e comunidade no Minecraft.

---

## Sobre o Projeto

Site oficial da CraftSapiens, plataforma de ensino gamificado no Minecraft. É o portal para alunos, pais e a comunidade e reúne:

- Autenticação integrada com o servidor Minecraft (nLogin + NextAuth.js)
- Loja própria para planos VIP/Premium e itens in-game
- Fórum da comunidade com categorias, posts e reputação
- Grade curricular e cronograma de aulas interativo
- Status do servidor em tempo real
- Blog com notícias e atualizações
- Fundo animado com partículas no estilo Minecraft

---

## Stack Técnica

| Tecnologia | Versão | Propósito |
|---|---|---|
| **Next.js** | 16 (App Router) | Framework React com SSR/SSG e API Routes |
| **React** | 19 | Biblioteca de UI |
| **TypeScript** | 5+ | Tipagem estática |
| **Tailwind CSS** | 4 | Estilização utilitária e responsividade |
| **Framer Motion** | 12+ | Animações de UI |
| **Prisma ORM** | 7+ | Acesso aos dois bancos (PostgreSQL e MariaDB) |
| **PostgreSQL** | 17 | Dados do site (usuários, loja, fórum, blog, aulas) |
| **MariaDB** | — | Somente a tabela `nlogin` do servidor Minecraft |
| **NextAuth.js** | 5 (beta) | Autenticação (JWT + Credentials) |
| **MercadoPago** | SDK 2 | Pagamentos da loja |
| **Lucide React** | — | Ícones |

---

## Primeiros Passos

### Pré-requisitos

- Node.js 20.9+
- Docker (para o PostgreSQL local)
- Acesso a um MariaDB com a tabela `nlogin` do plugin nLogin

### Instalação

```bash
# Clonar o repositório
git clone <url-do-repo>
cd craftspiens-website

# Configurar variáveis de ambiente
cp .env.example .env
# Preencher POSTGRES_URL, DATABASE_URL, AUTH_SECRET, AUTH_URL, SMTP_*, MERCADOPAGO_*

# Subir o PostgreSQL local (porta 5454)
docker compose up -d

# Instalar dependências (gera os dois Prisma Clients automaticamente)
npm install

# Criar as tabelas do site no PostgreSQL
npm run db:push:pg

# Popular aulas, blog, fórum e loja com o conteúdo inicial
npm run db:seed
```

> Atenção: nunca rode `prisma db push` com o `prisma.config.ts` (MariaDB): ele aponta para o banco do servidor Minecraft, que é gerenciado pelo plugin nLogin.

### Executar

```bash
# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build
npm run start

# Verificações
npm run typecheck
npm run lint
```

O site estará disponível em [http://localhost:3000](http://localhost:3000).

### Scripts de banco

| Script | Descrição |
|---|---|
| `npm run db:generate` | Gera os Prisma Clients (PostgreSQL e MariaDB) em `src/generated/` |
| `npm run db:push:pg` | Aplica `prisma/schema.pg.prisma` no PostgreSQL |
| `npm run db:seed` | Executa todos os seeds (`db:seed:aulas`, `:blog`, `:forum`, `:loja`) |
| `npm run aulas:youtube` | Atualiza a lista de vídeos e lives do canal no YouTube (`scripts/data/youtube-videos.json`, requer o yt-dlp) |
| `npm run aulas:atualizar` | `aulas:youtube` seguido de `db:seed:aulas`; usado pela atualização automática em produção |
| `npm run db:migrate-v13` | Migração única dos dados antigos do MariaDB para o PostgreSQL (use `-- --dry-run` antes) |

---

## Produção

O site roda em uma VPS dedicada, atrás da Cloudflare. Os bancos de dados (PostgreSQL do site e MariaDB do nLogin) ficam no servidor físico, acessados por um túnel WireGuard.

```
Visitante → Cloudflare → VPS do site (nginx → Next.js) ──WireGuard──▶ servidor físico (PostgreSQL + MariaDB)
```

Instalação, configuração de rede, Cloudflare, backup e operação estão em [docs/arquitetura-producao.md](./docs/arquitetura-producao.md).

---

## Estrutura do Projeto

```
src/
├── app/                  # Rotas (App Router)
│   ├── api/              # API Routes (auth, loja, fórum, blog, aulas, perfil...)
│   ├── aulas/            # Página de aulas
│   ├── blog/             # Blog
│   ├── comunidade/       # Fórum da comunidade
│   ├── contato/          # Formulário de contato
│   ├── cronograma/       # Cronograma de aulas
│   ├── login/            # Login
│   ├── registro/         # Registro
│   ├── loja/             # Loja
│   ├── perfil/           # Perfil do jogador
│   ├── sobre/            # Sobre a CraftSapiens
│   ├── status/           # Status do servidor
│   └── termos/           # Termos e condições
├── components/           # Componentes React
│   ├── home/             # Seções da landing page
│   ├── layout/           # Navbar, Footer, Background
│   └── ui/               # Componentes reutilizáveis
├── generated/            # Prisma Clients gerados (não versionados)
├── lib/                  # Utilitários (auth, env, prisma, rate-limit, email...)
├── instrumentation.ts    # Validação das variáveis de ambiente na inicialização
└── proxy.ts              # Proteção das rotas autenticadas

prisma/
├── schema.prisma         # MariaDB — tabela nlogin (servidor Minecraft)
└── schema.pg.prisma      # PostgreSQL — dados do site

scripts/                  # Seeds, sincronização com o YouTube e migração única MariaDB → PostgreSQL
docs/                     # Documentação do projeto
```

---

## Documentação

A documentação detalhada do projeto está em [`docs/`](./docs/README.md), incluindo:

- [Stack Técnica](./docs/stack-tecnica.md) — Arquitetura e integrações
- [Design System](./docs/design-system.md) — Paleta de cores, tipografia e componentes
- [Padrão de Commits](./docs/padrao-de-commits.md) — Formato das mensagens, versionamento e checklist
- [Arquitetura de Produção](./docs/arquitetura-producao.md) — Infraestrutura, deploy, backup e operação
- [Login com Microsoft e Google](./docs/login-externo.md) — Login externo e vínculo de contas
- [E-mail](./docs/email.md) — Envio automático pelo Cloudflare e atendimento pelo Gmail
- Especificações de cada página e componente

---

## Contato

| | |
|---|---|
| **IP do Servidor** | `jogar.craftsapiens.com.br` |
| **E-mail** | contato@craftsapiens.com.br |
| **Discord** | discord.gg/craftsapiens |
| **YouTube** | youtube.com/channel/UCdea6doNy_AypHr4S2tPUTw |
| **Instagram** | @universidadecraftsapiens |
| **TikTok** | @craftsapiens |
