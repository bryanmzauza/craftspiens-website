# Stack Técnica & Arquitetura

---

## Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 16 (App Router) | Framework React com SSR/SSG, rotas, API routes |
| **TypeScript** | 5+ | Tipagem estática para segurança e DX |
| **Tailwind CSS** | 4 | Estilização utilitária, responsividade |
| **Framer Motion** | 12+ | Animações de UI (transições de página, hover, scroll) |
| **Canvas API** | Nativo | Partículas animadas do fundo (blocos Minecraft, orbs de XP) |

---

## Backend & Banco de Dados

| Tecnologia | Propósito |
|------------|-----------|
| **Next.js API Routes** | Endpoints do backend (REST API) |
| **Prisma ORM** | Acesso aos dois bancos, com um Prisma Client para cada |
| **PostgreSQL** | Banco principal do site: usuários, perfis, loja, fórum, blog, aulas, rate limiting |
| **MariaDB** | Banco do servidor Minecraft — o site usa apenas a tabela `nlogin` |

O vínculo entre os bancos é o campo `users.nlogin_id` (PostgreSQL), que guarda o `id` da tabela `nlogin` (MariaDB). Não há chave estrangeira entre bancos: as consultas que precisam dos dois lados usam os helpers de `src/lib/nlogin.ts`.

### Esquema do Banco de Dados (Visão Geral)

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│     nlogin       │     │      users        │     │    profiles      │
│  (tabela nLogin) │────▶│  (tabela site)    │────▶│  (dados extras)  │
│  - username      │     │  - id             │     │  - userId        │
│  - password_hash │     │  - nlogin_id (FK) │     │  - avatar        │
│  - last_ip       │     │  - email          │     │  - bio           │
│  - last_login    │     │  - role           │     │  - sapiens_coins │
└─────────────────┘     │  - created_at     │     │  - xp            │
                         └──────────────────┘     └─────────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    ▼             ▼             ▼
             ┌───────────┐ ┌───────────┐ ┌───────────┐
             │  orders    │ │  posts     │ │  comments  │
             │  (compras) │ │  (fórum)   │ │  (fórum)   │
             └───────────┘ └───────────┘ └───────────┘
```

---

## Autenticação — Integração nLogin

O plugin nLogin é usado no servidor Minecraft para autenticação de jogadores. O novo site compartilha o mesmo banco de credenciais.

### Fluxo de Registro (Site → Servidor)

```
1. Jogador acessa /registro no site
2. Preenche: username (nick do Minecraft), email, senha
3. Site valida os dados e verifica se username já existe na tabela nlogin
4. Se não existe:
   a. Cria registro na tabela nlogin (hash bcrypt da senha)
   b. Cria registro na tabela users (dados do site)
   c. Vincula users.nlogin_id → nlogin.id
5. Jogador pode logar tanto no site quanto no servidor Minecraft com a mesma senha
```

### Fluxo de Login

```
1. Jogador acessa /login
2. Informa username + senha
3. Site busca na tabela nlogin pelo username
4. Compara hash bcrypt da senha
5. Se válido: cria sessão JWT (NextAuth.js)
6. Redireciona para /perfil
```

### Fluxo de Troca de Senha

```
1. Jogador logado acessa /perfil > Alterar Senha
2. Informa senha atual + nova senha
3. Site atualiza hash na tabela nlogin
4. Senha atualizada vale tanto para site quanto para servidor
5. users.session_version é incrementado: todas as sessões abertas são encerradas
```

### Sessões

- JWT com validade de 7 dias.
- A cada minuto o token é revalidado contra o banco (role, conta ativa e `session_version`).
- Trocar ou redefinir a senha e desativar a conta incrementam `session_version`, o que encerra as sessões abertas em até 1 minuto.
- Uma conta desativada é reativada ao fazer login novamente.

### Rate limiting

- Contadores na tabela `rate_limits` do PostgreSQL (`src/lib/rate-limit.ts`): valem para todas as instâncias e sobrevivem a reinícios.
- O IP do cliente vem somente do header `X-Real-IP` definido pelo nginx (`src/lib/client-ip.ts`). O `X-Forwarded-For` é ignorado porque pode ser forjado pelo cliente.
- Login: limite por IP e por conta.

### Tabela nLogin (Referência)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | INT (PK) | ID do registro |
| `last_name` | VARCHAR | Username/nick do jogador |
| `unique_id` | VARCHAR | UUID do jogador Minecraft |
| `real_name` | VARCHAR | Nome real registrado |
| `password` | VARCHAR | Hash bcrypt da senha |
| `ip` | VARCHAR | Último IP de login |
| `last_login` | BIGINT | Timestamp do último login |
| `reg_date` | BIGINT | Timestamp do registro |

> Importante: o campo `password` usa hash bcrypt. O site deve usar a mesma lib/algoritmo para gerar e validar hashes.

---

## Autenticação — NextAuth.js

| Config | Valor |
|--------|-------|
| **Provider** | Credentials (custom) |
| **Session Strategy** | JWT |
| **Adapter** | Custom Prisma adapter (lê/escreve na tabela nlogin) |
| **Cookies** | HTTP-only, Secure, SameSite=Lax |

---

## Loja — Gateway de Pagamento

| Opção | Detalhes |
|-------|----------|
| **MercadoPago** (recomendado) | API brasileira, PIX, cartão, boleto |
| **Stripe** (alternativa) | Cartão internacional |

### Fluxo de Compra

```
1. Jogador logado adiciona produto ao carrinho
2. Finaliza compra → site cria o pedido (PENDING) e a preferência no MercadoPago
   com external_reference = id do pedido
3. Jogador paga (PIX, cartão, etc.) no checkout do MercadoPago
4. MercadoPago envia o webhook para /api/loja/webhook
5. Site valida a assinatura (x-signature), busca o pagamento na API do MercadoPago
   e localiza o pedido pelo external_reference
6. Na aprovação (moeda BRL e valor >= total do pedido): pedido APPROVED,
   baixa de estoque e remoção dos itens do carrinho — tudo em uma transação idempotente
7. Jogador recebe confirmação por email
```

> A entrega automática dos itens no servidor Minecraft (`products.server_command`) ainda não está implementada.

### Webhook — regras de segurança

| Regra | Comportamento |
|-------|---------------|
| `MERCADOPAGO_WEBHOOK_SECRET` ausente | Responde 503 e não processa nada |
| Assinatura ausente ou inválida | Responde 401 |
| Notificação repetida | Ignorada (atualização condicional do status) |
| Valor pago menor que o total ou moeda diferente de BRL | Pedido não é aprovado |
| Status "pending" depois de aprovado | Ignorado (o status nunca regride) |

---

## Status do Servidor — Minecraft Query Protocol

O site consulta o status do servidor Minecraft pela API pública mcsrvstat.us (`/api/server-status`). A consulta direta via Minecraft Server List Ping (TCP na porta 25565) fica para uma versão futura.

### Dados Disponíveis

| Dado | Fonte |
|------|-------|
| Jogadores online (atual/máximo) | Server List Ping |
| Lista de jogadores online | Server List Ping |
| Versão do servidor | Server List Ping |
| MOTD (descrição) | Server List Ping |
| Latência | Server List Ping |

### Rankings

| Ranking | Fonte | Status |
|---------|-------|--------|
| Top Aulas Concluídas | `website_user_lesson_progress` (PostgreSQL), via `/api/ranking` | Disponível |
| Top XP | Economia do servidor | Pendente — XP ainda não é sincronizado do jogo |
| Top Moedas SAPIENS | Economia do servidor | Pendente |
| Top Tempo Online | Playtime do servidor | Pendente |

Só entram no ranking contas ativas com perfil público.

---

## Fórum — Arquitetura

| Entidade | Campos Principais |
|----------|-------------------|
| **Categoria** | id, nome, descrição, slug, ordem, ícone |
| **Tópico** | id, título, conteúdo, autorId, categoriaId, fixado, fechado, views, createdAt |
| **Comentário** | id, conteúdo, autorId, topicoId, parentId (respostas aninhadas), createdAt |
| **Reação** | id, userId, topicoId/comentarioId, tipo (like/dislike) |
| **Reputação** | Calculada por: posts + likes recebidos - dislikes |

### Permissões do Fórum

| Role | Criar Tópico | Comentar | Editar Próprio | Moderar | Fixar/Fechar |
|------|:------------:|:--------:|:--------------:|:-------:|:------------:|
| Visitante | Não | Não | Não | Não | Não |
| Aluno | Sim | Sim | Sim | Não | Não |
| Professor | Sim | Sim | Sim | Sim | Sim |
| Moderador | Sim | Sim | Sim | Sim | Sim |
| Admin | Sim | Sim | Sim | Sim | Sim |

---

## Deploy & Infraestrutura

| Serviço | Uso |
|---------|-----|
| **Cloudflare** | DNS, TLS público e proteção DDoS do domínio do site |
| **VPS do site** | nginx + Next.js (`next start` em 127.0.0.1) |
| **Servidor físico** | PostgreSQL (Docker) com os dados do site, MariaDB do Pterodactyl (nLogin) e servidores Minecraft |
| **WireGuard `wg-site`** | Túnel exclusivo entre a VPS do site e o servidor físico, usado para o acesso aos bancos |
| **Docker Compose** | PostgreSQL local para desenvolvimento (porta 5454) |

Arquitetura completa, instalação, backup e operação: [Arquitetura de Produção](./arquitetura-producao.md).

O rate limiting depende do IP real do visitante no header `X-Real-IP`, montado pelo nginx a partir do `CF-Connecting-IP` da Cloudflare. Os headers de segurança (CSP, HSTS, X-Frame-Options etc.) são enviados pelo Next.js (`next.config.ts`).

### Variáveis de Ambiente

Modelo completo em [`.env.example`](../.env.example). Todas as variáveis abaixo são validadas em `src/lib/env.ts`; em produção o servidor não inicia se alguma estiver faltando.

```env
# Banco de dados — PostgreSQL (dados do site)
POSTGRES_URL="postgresql://craftsapiens:craftsapiens_dev@localhost:5454/craftsapiens"

# Banco de dados — MariaDB (nLogin do Minecraft)
DATABASE_URL="mysql://user:password@host:3306/craftsapiens"

# Auth.js (NextAuth)
AUTH_URL="https://craftsapiens.com.br"
AUTH_SECRET="..."            # openssl rand -base64 32

# Pagamentos (MercadoPago)
MERCADOPAGO_ACCESS_TOKEN="..."
MERCADOPAGO_WEBHOOK_SECRET="..."

# Minecraft Server (opcional)
MINECRAFT_SERVER_HOST="jogar.craftsapiens.com.br"
MINECRAFT_SERVER_PORT=25565

# Email
SMTP_HOST="..."
SMTP_PORT=587
SMTP_SECURE="false"
SMTP_USER="..."
SMTP_PASS="..."
SMTP_FROM="noreply@craftsapiens.com.br"
```

---

## Estrutura de Pastas (Next.js App Router)

```
src/
├── app/
│   ├── layout.tsx              # Layout raiz (navbar, footer, fundo animado)
│   ├── page.tsx                # Home (/)
│   ├── sobre/page.tsx          # Sobre (/sobre)
│   ├── aulas/
│   │   ├── page.tsx            # Catálogo de aulas (/aulas)
│   │   └── [slug]/page.tsx     # Detalhe da aula (/aulas/matematica)
│   ├── cronograma/page.tsx     # Grade curricular (/cronograma)
│   ├── loja/
│   │   ├── page.tsx            # Vitrine da loja (/loja)
│   │   ├── [id]/page.tsx       # Detalhe do produto (/loja/vip-premium)
│   │   └── carrinho/page.tsx   # Carrinho (/loja/carrinho)
│   ├── comunidade/
│   │   ├── page.tsx            # Fórum - categorias (/comunidade)
│   │   ├── [categoria]/page.tsx        # Tópicos da categoria
│   │   └── [categoria]/[topico]/page.tsx # Tópico + comentários
│   ├── login/page.tsx          # Login (/login)
│   ├── registro/page.tsx       # Registro (/registro)
│   ├── contato/page.tsx        # Contato (/contato)
│   ├── perfil/
│   │   ├── page.tsx            # Dashboard do jogador (/perfil)
│   │   ├── compras/page.tsx    # Histórico de compras
│   │   └── configuracoes/page.tsx # Configurações da conta
│   ├── status/page.tsx         # Status do servidor (/status)
│   ├── blog/
│   │   ├── page.tsx            # Lista de posts (/blog)
│   │   └── [slug]/page.tsx     # Post individual (/blog/titulo-do-post)
│   ├── termos/page.tsx         # Termos e condições (/termos)
│   └── api/
│       ├── auth/[...nextauth]/route.ts  # NextAuth API
│       ├── server-status/route.ts       # Status do servidor MC
│       ├── loja/
│       │   ├── produtos/route.ts
│       │   ├── checkout/route.ts
│       │   └── webhook/route.ts
│       ├── forum/
│       │   ├── categorias/route.ts
│       │   ├── topicos/route.ts
│       │   └── comentarios/route.ts
│       └── blog/
│           └── posts/route.ts
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── AnimatedBackground.tsx
│   ├── ui/ (componentes reutilizáveis)
│   ├── home/
│   ├── loja/
│   ├── forum/
│   └── perfil/
├── lib/
│   ├── prisma.ts               # Clientes Prisma (PG + MariaDB)
│   ├── env.ts                  # Validação das variáveis de ambiente
│   ├── auth.ts                 # Config NextAuth
│   ├── nlogin.ts               # Funções de integração nLogin (cross-DB)
│   ├── rate-limit.ts           # Rate limiting no PostgreSQL
│   ├── client-ip.ts            # IP do cliente (X-Real-IP do nginx)
│   ├── mercadopago.ts          # Clientes MercadoPago
│   └── mercadopago-signature.ts # Validação da assinatura do webhook
├── generated/                  # Prisma Clients gerados (npm run db:generate, não versionados)
│   ├── prisma-pg/              # Cliente Prisma para PostgreSQL
│   └── prisma-mariadb/         # Cliente Prisma para MariaDB
├── styles/
│   └── globals.css             # Tailwind base + custom fonts
└── prisma/
    ├── schema.prisma           # Schema MariaDB (nLogin)
    └── schema.pg.prisma        # Schema PostgreSQL (dados do site)
```
