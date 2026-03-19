# 🛠️ Stack Técnica & Arquitetura

---

## Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Next.js** | 14+ (App Router) | Framework React com SSR/SSG, rotas, API routes |
| **TypeScript** | 5+ | Tipagem estática para segurança e DX |
| **Tailwind CSS** | 3+ | Estilização utilitária, responsividade |
| **Framer Motion** | 10+ | Animações de UI (transições de página, hover, scroll) |
| **Canvas API** | Nativo | Partículas animadas do fundo (blocos Minecraft, orbs de XP) |

---

## Backend & Banco de Dados

| Tecnologia | Propósito |
|------------|-----------|
| **Next.js API Routes** | Endpoints do backend (REST API) |
| **Prisma ORM** | Abstração do banco de dados, migrations, type-safety |
| **MySQL / MariaDB** | Banco principal — compatível com nLogin do servidor Minecraft |

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

O plugin **nLogin** é usado no servidor Minecraft para autenticação de jogadores. O novo site compartilha o mesmo banco de credenciais.

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
```

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

> **Importante**: O campo `password` usa hash bcrypt. O site deve usar a mesma lib/algoritmo para gerar e validar hashes.

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
| **Stripe** (alternativa) | Cartão internacional, experiência premium |

### Fluxo de Compra

```
1. Jogador logado adiciona produto ao carrinho
2. Finaliza compra → escolhe forma de pagamento
3. Site cria sessão de pagamento via API do gateway
4. Jogador paga (PIX, cartão, etc.)
5. Webhook do gateway notifica o site sobre pagamento aprovado
6. Site ativa o produto:
   - VIP/Premium: atualiza permissões na tabela do servidor (via API ou banco direto)
   - Item in-game: registra na tabela de itens pendentes para entrega no servidor
7. Jogador recebe confirmação por email + notificação no perfil
```

---

## Status do Servidor — Minecraft Query Protocol

O site consulta o servidor Minecraft em tempo real usando o **Minecraft Server List Ping** (protocolo TCP na porta 25565).

### Dados Disponíveis

| Dado | Fonte |
|------|-------|
| Jogadores online (atual/máximo) | Server List Ping |
| Lista de jogadores online | Server List Ping |
| Versão do servidor | Server List Ping |
| MOTD (descrição) | Server List Ping |
| Latência | Server List Ping |

### Rankings

Os rankings são obtidos diretamente do banco de dados do servidor:

| Ranking | Tabela/Fonte |
|---------|-------------|
| Top XP | Tabela de experiência do servidor |
| Top Moedas SAPIENS | Tabela de economia do servidor |
| Top Tempo Online | Tabela de playtime |
| Top Aulas Concluídas | Tabela customizada de progresso |

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
| Visitante | ❌ | ❌ | ❌ | ❌ | ❌ |
| Aluno | ✅ | ✅ | ✅ | ❌ | ❌ |
| Professor | ✅ | ✅ | ✅ | ✅ | ✅ |
| Moderador | ✅ | ✅ | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Deploy & Infraestrutura

| Serviço | Uso |
|---------|-----|
| **Vercel** | Hosting do Next.js (frontend + API routes) |
| **PlanetScale / Railway / VPS** | Hosting do MySQL/MariaDB |
| **Servidor Minecraft** | VPS existente (jogar.craftsapiens.com.br) |

### Variáveis de Ambiente

```env
# Banco de dados
DATABASE_URL="mysql://user:password@host:3306/craftsapiens"

# NextAuth
NEXTAUTH_URL="https://craftsapiens.com.br"
NEXTAUTH_SECRET="..."

# Pagamentos (MercadoPago)
MERCADOPAGO_ACCESS_TOKEN="..."
MERCADOPAGO_WEBHOOK_SECRET="..."

# Minecraft Server
MINECRAFT_SERVER_HOST="jogar.craftsapiens.com.br"
MINECRAFT_SERVER_PORT=25565
MINECRAFT_QUERY_PORT=25565

# Email (para contato e notificações)
SMTP_HOST="..."
SMTP_PORT=587
SMTP_USER="contato@craftsapiens.com.br"
SMTP_PASSWORD="..."
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
│   ├── prisma.ts               # Cliente Prisma
│   ├── auth.ts                 # Config NextAuth
│   ├── nlogin.ts               # Funções de integração nLogin
│   ├── minecraft-status.ts     # Query do servidor MC
│   └── payment.ts              # Integração MercadoPago/Stripe
├── styles/
│   └── globals.css             # Tailwind base + custom fonts
└── prisma/
    └── schema.prisma           # Schema do banco de dados
```
