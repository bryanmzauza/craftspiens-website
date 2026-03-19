# ⛏️ CraftSapiens — Website

> **"Construa Seu Futuro Jogando"**
>
> O Maior Metaverso Educacional do Mundo. Aulas reais, gamificação e comunidade no Minecraft.

---

## Sobre o Projeto

Site oficial da **CraftSapiens** — a maior plataforma de ensino gamificado via Minecraft do mundo. Serve como portal principal para alunos, pais e a comunidade, oferecendo:

- 🔐 **Autenticação integrada** com o servidor Minecraft (nLogin + NextAuth.js)
- 🛒 **Loja própria** para planos VIP/Premium e itens in-game
- 💬 **Fórum da comunidade** com categorias, posts e reputação
- 📚 **Grade curricular** e cronograma de aulas interativo
- 📡 **Status do servidor** em tempo real
- 📝 **Blog** com notícias e atualizações
- ✨ **Background animado** com partículas estilo Minecraft

---

## Stack Técnica

| Tecnologia | Versão | Propósito |
|---|---|---|
| **Next.js** | 16 (App Router) | Framework React com SSR/SSG e API Routes |
| **React** | 19 | Biblioteca de UI |
| **TypeScript** | 5+ | Tipagem estática |
| **Tailwind CSS** | 4 | Estilização utilitária e responsividade |
| **Framer Motion** | 12+ | Animações de UI |
| **Prisma ORM** | 7+ | Abstração do banco de dados (MySQL/MariaDB) |
| **NextAuth.js** | 5 (beta) | Autenticação (JWT + Credentials) |
| **Lucide React** | — | Ícones |
| **Canvas API** | Nativo | Partículas animadas do fundo |

---

## Primeiros Passos

### Pré-requisitos

- **Node.js** 18+
- **MySQL** ou **MariaDB**

### Instalação

```bash
# Clonar o repositório
git clone <url-do-repo>
cd craftsapiens-website

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Preencher DATABASE_URL, NEXTAUTH_SECRET, etc.

# Gerar o Prisma Client
npx prisma generate

# Aplicar schema no banco de dados
npx prisma db push
```

### Executar

```bash
# Servidor de desenvolvimento
npm run dev

# Build de produção
npm run build
npm run start

# Lint
npm run lint
```

O site estará disponível em [http://localhost:3000](http://localhost:3000).

---

## Estrutura do Projeto

```
src/
├── app/                  # Rotas (App Router)
│   ├── api/              # API Routes (auth, server-status)
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
├── generated/            # Prisma Client gerado
└── lib/                  # Utilitários (auth, prisma, constants)

prisma/
└── schema.prisma         # Schema do banco de dados

docs/                     # Documentação completa do projeto
```

---

## Documentação

A documentação detalhada do projeto está em [`docs/`](./docs/README.md), incluindo:

- [Stack Técnica](./docs/stack-tecnica.md) — Arquitetura e integrações
- [Design System](./docs/design-system.md) — Paleta de cores, tipografia e componentes
- Especificações de cada página e componente

---

## Contato

| | |
|---|---|
| **IP do Servidor** | `jogar.craftsapiens.com.br` |
| **E-mail** | contato@craftsapiens.com.br |
| **Discord** | discord.io/craftsapiens |
| **YouTube** | youtube.com/channel/UCdea6doNy_AypHr4S2tPUTw |
| **Instagram** | @universidadecraftsapiens |
| **TikTok** | @craftsapiens |
