# Changelog

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [v0.1] — 19/03/2026 — Estrutura base do projeto e Landing Page

### Adicionado

- **Inicialização do projeto Next.js 16** — App Router, TypeScript 5, Tailwind CSS 4, ESLint
- **Dependências principais** — framer-motion, lucide-react, next-auth (v5 beta), @prisma/client, prisma
- **Design System via Tailwind** (`src/app/globals.css`) — Paleta de cores CraftSapiens (verde, marrom, cinza escuro), fontes (Inter, Press Start 2P, JetBrains Mono), scrollbar customizada, variáveis CSS
- **Layout raiz** (`src/app/layout.tsx`) — Metadata SEO global com título template, lang pt-BR, integração das 3 fontes via next/font/google, montagem dos componentes globais (AnimatedBackground, Navbar, Footer)
- **Componente AnimatedBackground** (`src/components/layout/AnimatedBackground.tsx`) — Canvas API com partículas estilo Minecraft (blocos, orbs de XP, estrelas, poeira), parallax por layers, respects `prefers-reduced-motion`, fallback CSS gradient, pausar em tab inativa, debounce no resize, contagem reduzida em mobile
- **Componente Navbar** (`src/components/layout/Navbar.tsx`) — Logo CraftSapiens (Press Start 2P), 5 links de navegação centralizados (Sobre, Aulas, Cronograma, Loja, Comunidade), botões Login/Criar Conta, link ativo detectado por `usePathname`, glassmorphism no scroll, menu hambúrguer mobile com sidebar deslizante e overlay
- **Componente Footer** (`src/components/layout/Footer.tsx`) — 4 colunas (Logo+redes, Institucional, Suporte, Contato), barra de newsletter com input e-mail, botão copiar IP do servidor, links de redes sociais, disclaimer Mojang, copyright dinâmico
- **Componente SocialIcons** (`src/components/ui/SocialIcons.tsx`) — SVGs inline para Discord, YouTube, Instagram, TikTok, Twitter/X, Facebook, Telegram, hover com cor da respectiva rede
- **Componente Button** (`src/components/ui/Button.tsx`) — Variantes primary (verde CTA) e secondary (outlined branco), suporte a href (renderiza Link) ou button, fullWidth
- **Página Home — Landing Page** (`src/app/page.tsx`) — Implementação completa com 6 seções:
  - **HeroSection** — Título "CONSTRUA SEU FUTURO JOGANDO" em Minecrafter, subtítulo, descrição, CTAs (Iniciar Jornada / Ver Grade), animações de entrada (Framer Motion)
  - **FeaturesSection** — 3 cards clicáveis (Aulas Gamificadas, Moeda SAPIENS, Enem & Reforço) com ícones Lucide, hover scale+glow, stagger animation
  - **HowItWorksSection** — 4 steps visuais (Crie conta → Entre no servidor → Assista aulas → Conquiste recompensas), fade-in on scroll
  - **StatsSection** — 3 métricas com contagem animada (IntersectionObserver): Jogadores Online, Total de Alunos, Aulas Disponíveis
  - **TestimonialsSection** — 3 depoimentos com avatar, nome, role (aluno/pai), grid responsivo, stagger animation
  - **CtaSection** — CTA final "Pronto para construir seu futuro?" com gradiente verde
- **Páginas placeholder com SEO** — Sobre (`/sobre`), Aulas (`/aulas`), Cronograma (`/cronograma`), Loja (`/loja`), Comunidade (`/comunidade`), Contato (`/contato`), Status (`/status`), Blog (`/blog`), Termos (`/termos`)
- **Páginas de autenticação** — Login (`/login`) com formulário username+senha, link para registro; Registro (`/registro`) com formulário username+email+senha+confirmação
- **Páginas de perfil** — Dashboard (`/perfil`), Minhas Compras (`/perfil/compras`), Configurações (`/perfil/configuracoes`)
- **Schema Prisma completo** (`prisma/schema.prisma`) — 15 modelos: Nlogin (tabela nLogin do Minecraft), User, Profile, Product, Order, OrderItem, Coupon, ForumCategory, Post, Comment, Reaction, Report, BlogCategory, BlogPost, ContactMessage, Newsletter | 5 enums: Role, ProductCategory, OrderStatus, ReactionType
- **Configuração NextAuth v5** (`src/lib/auth.ts`) — Provider Credentials com skeleton de integração nLogin (bcrypt), sessão JWT, callbacks para token/session, páginas customizadas (/login, /registro)
- **API Route — Auth** (`src/app/api/auth/[...nextauth]/route.ts`) — Handler GET/POST do NextAuth
- **API Route — Server Status** (`src/app/api/server-status/route.ts`) — Endpoint `/api/server-status` consultando API pública mcsrvstat.us, retorna online/offline, players, versão, MOTD
- **Constantes do projeto** (`src/lib/constants.ts`) — NAV_LINKS, SOCIAL_LINKS, SERVER_IP, CONTACT_EMAIL, DISCLAIMER, COPYRIGHT, etc.
- **Prisma client singleton** (`src/lib/prisma.ts`) — Instância global com cache em desenvolvimento
- **next.config.ts** — Domínios de imagem (mc-heads.net, crafatar.com) para avatares Minecraft
- **Variáveis de ambiente** (`.env`) — Template com DATABASE_URL, NEXTAUTH, MERCADOPAGO, MINECRAFT_SERVER, SMTP

### Decisões técnicas

- **Prisma generator `prisma-client-js`** em vez do novo `prisma-client` (v7 adapter-based): escolhido por estabilidade e compatibilidade com o ecossistema existente, sem necessidade de adapters adicionais para MySQL
- **Press Start 2P** como fallback de fonte Minecrafter: fonte Minecrafter custom será adicionada em versão futura; Press Start 2P (Google Fonts) oferece estética pixelada similar sem necessidade de self-hosting imediato
- **API mcsrvstat.us** como solução temporária para status do servidor: consulta TCP direta ao Minecraft Server List Ping será implementada em versão futura quando o backend tiver acesso direto ao servidor

---

## [v0.0.1] — 19/03/2026 — Criação do repositório

### Adicionado

- **Documentação completa de regras de negócio** — Criação da pasta `docs/` com especificações detalhadas de todas as páginas, componentes e funcionalidades do site
- **docs/README.md** — Visão geral do projeto, dados da CraftSapiens e índice da documentação
- **docs/stack-tecnica.md** — Definição da stack tecnológica (Next.js 14+ / TypeScript / Tailwind CSS / Prisma / MySQL), arquitetura do sistema, integração nLogin, gateway de pagamento (MercadoPago), estrutura de pastas e variáveis de ambiente
- **docs/design-system.md** — Design system completo: paleta de cores (tema Minecraft), tipografia (Minecrafter + Inter), espaçamento, breakpoints, componentes base (botões, cards, inputs, badges) e efeitos visuais
- **docs/paginas/01-home.md** — Landing page: hero "CONSTRUA SEU FUTURO JOGANDO", CTAs, cards de features (Aulas Gamificadas, Moeda SAPIENS, Enem & Reforço), seção "Como Funciona", status do servidor em tempo real, depoimentos e CTA final
- **docs/paginas/02-sobre.md** — Página Sobre: história da CraftSapiens, timeline, quem somos, missão/visão/valores, reconhecimento na mídia, equipe e hierarquia do servidor
- **docs/paginas/03-aulas.md** — Catálogo de aulas: método de ensino gamificado, grid de disciplinas com filtros (nível, disciplina, busca), detalhe por disciplina, seção ENEM & Reforço, seção para pais, modelo de dados de Disciplina e Aula
- **docs/paginas/04-cronograma.md** — Grade curricular: visão semanal/mensal, filtros, detalhes de aula (modal), próximas aulas com countdown, exportação para calendário (.ics), avisos de férias/recesso
- **docs/paginas/05-loja.md** — Loja completa: categorias (VIP/Premium, Ranks, Cosméticos, Moedas, Kits), comparativo de planos VIP, carrinho de compras, checkout com MercadoPago (PIX/cartão/boleto), ativação automática de produtos, sistema de cupons, modelo de dados de Produto/Pedido/Item/Cupom, regras de segurança
- **docs/paginas/06-comunidade.md** — Fórum integrado: categorias, tópicos + comentários (Markdown), sistema de reputação e badges, moderação completa, busca, notificações, anti-spam, modelo de dados de Categoria/Tópico/Comentário/Reação/Report
- **docs/paginas/07-auth.md** — Autenticação: registro com integração nLogin (bcrypt, conta compartilhada site ↔ servidor Minecraft), login, recuperação de senha, verificação de disponibilidade em tempo real, proteção de rotas, segurança (rate limiting, CSRF, anti-enumeração)
- **docs/paginas/08-contato.md** — Contato: canais (WhatsApp, email, Discord), redes sociais, formulário de contato com categorias, FAQ rápido, newsletter com double opt-in, modelo de dados de Mensagem e Newsletter
- **docs/paginas/09-perfil.md** — Perfil do jogador: dashboard com métricas (Moedas SAPIENS, XP, playtime, aulas), progresso por disciplina, atividade recente, histórico de compras, configurações (dados, senha, notificações, privacidade, zona de perigo), perfil público, sincronização com servidor Minecraft
- **docs/paginas/10-status-servidor.md** — Status do servidor: indicador online/offline em tempo real, lista de jogadores online, gráfico histórico de jogadores (24h/7d/30d), rankings múltiplos (XP, Moedas, Tempo Online, Aulas), ranking pessoal, API endpoints
- **docs/paginas/11-blog.md** — Blog: lista de posts com categorias e busca, post individual com rich text, posts relacionados, compartilhamento, sidebar, gerenciamento admin, modelo de dados de Post e Categoria
- **docs/paginas/12-termos.md** — Termos e Condições completos (adesão, regras, punições, premium, contribuição, estorno, dados, Moeda SAPIENS, manutenção, equipe, ouvidoria, encerramento) + Política de Privacidade (LGPD: dados coletados, uso, cookies, direitos do usuário, menores)
- **docs/componentes/navbar.md** — Navbar: logo, links de navegação, estados logado/não-logado, dropdown de perfil, notificações, mini status do servidor, scroll behavior (glassmorphism), menu hambúrguer mobile
- **docs/componentes/footer.md** — Footer: 4 colunas (logo/redes, institucional, suporte, contato), newsletter, disclaimer legal Mojang, copyright, responsividade
- **docs/componentes/fundo-animado.md** — Background animado: partículas estilo Minecraft (blocos, orbs XP, estrelas, poeira), Canvas API, parallax por layers, interação com mouse, otimizações de performance (FPS target, object pool, prefers-reduced-motion), paleta de cores, fallback CSS
- **CHANGELOG.md** — Este arquivo de changelog

---

## [0.0.0] - 2026-03-19

### Adicionado

- Inicialização do repositório
- Estrutura de documentação completa do projeto CraftSapiens
