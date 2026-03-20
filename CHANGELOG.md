# Changelog

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [v0.3] — 20/03/2026 — Implementação completa de todas as páginas restantes

### Adicionado

- **Página Cronograma** (`src/components/cronograma/CronogramaContent.tsx`) — Implementação completa conforme docs/paginas/04-cronograma.md:
  - Hero com breadcrumb reutilizável (PageHero)
  - Visão semanal com grid 7 colunas por dia da semana, highlight no dia atual
  - Visão mensal com calendário navegável (← Anterior / Próximo →), dias com indicadores coloridos de aulas
  - Clique no dia do mês expande lista de aulas com animação
  - Filtros por disciplina, nível, professor e turno com selects, botão "Limpar filtros"
  - Toggle Semanal/Mensal com ícones
  - Botão "Exportar Calendário" (estrutura preparada para implementação .ics)
  - Sidebar "Próximas Aulas" com 5 aulas ordenadas cronologicamente e countdown relativo (em Xh Xmin / Amanhã / Dia da semana)
  - Modal de detalhes da aula com disciplina, professor, horário, descrição, IP do servidor, botões "Ver Disciplina" e "Adicionar Lembrete"
  - Indicador "AO VIVO" com pulse animado para aulas em andamento
  - Navegação entre semanas (← Semana anterior / Próxima semana →) com offset
  - Layout responsivo: desktop grid 7 colunas, mobile lista vertical por dia com barra de cor
  - 10 aulas mock distribuídas na semana com dados realistas de professores e disciplinas

- **Página Blog** (`src/components/blog/BlogContent.tsx`) — Implementação completa conforme docs/paginas/11-blog.md:
  - Hero com breadcrumb
  - Barra de busca global com ícone, filtra por título, resumo e tags
  - 7 categorias filtráveis (Todos, Novidades, Aulas, Eventos, Mídia, Tutoriais, Comunidade) com cores individuais
  - Post em destaque (primeiro post, card maior com imagem hero 21:9)
  - Grid responsivo de cards 3 colunas com: placeholder de imagem, badge de categoria colorido, título, resumo truncado (line-clamp-2), data, tempo de leitura
  - Paginação com navegação por números e setas
  - Estado vazio com ícone e mensagem quando nenhum post é encontrado
  - 9 posts mock com dados realistas (autores, categorias, tags, datas)
  - Links preparados para rota `/blog/[slug]`

- **Página Loja** (`src/components/loja/LojaContent.tsx`) — Implementação completa conforme docs/paginas/05-loja.md:
  - Hero com breadcrumb
  - Seção destaque "Planos VIP / Premium" com 3 cards comparativos (VIP, VIP+, Premium)
    - Cada plano com ícone, preço mensal, lista de features com ✅/❌, botão "Assinar"
    - Plano VIP+ marcado como "MAIS POPULAR" com borda destacada e banner dourado
  - Catálogo de 8 produtos em 4 categorias (Ranks, Cosméticos, Moedas, Kits)
  - Filtro por categoria com tabs
  - Card de produto com: placeholder de ícone colorido, badge (NOVO, POPULAR, MAIS VENDIDO), nome, descrição curta, preço com desconto riscado, botão "Adicionar"
  - Carrinho funcional com state local (Map):
    - Adicionar/remover itens
    - Contagem de itens e total calculado em tempo real
    - Barra flutuante fixa no bottom com contagem e total
    - Modal de carrinho com lista de itens, remoção individual, total e botão "Finalizar Compra"
  - Animações de entrada com Framer Motion stagger

- **Página Comunidade** (`src/components/comunidade/ComunidadeContent.tsx`) — Implementação completa conforme docs/paginas/06-comunidade.md:
  - Hero com breadcrumb dinâmico (muda conforme categoria aberta)
  - Barra de busca global do fórum
  - 7 categorias (Anúncios, Geral, Dúvidas, Sugestões, Bugs, Showroom, Off-Topic) com:
    - Emoji + ícone, nome, descrição, badge "STAFF" para categorias restritas
    - Contagem de tópicos e comentários
    - Último post com título, autor e tempo relativo
  - Navegação interna: clique em categoria → lista de tópicos
  - Lista de tópicos com: badges fixado (📌), fechado (🔒), resolvido (✅), título, autor com cargo, contagem de comentários e views, tempo da última atividade
  - Botão "Novo Tópico" (requer implementação de auth)
  - Botão "Voltar" para retornar à lista de categorias
  - Barra de estatísticas (total de tópicos, comentários, membros)
  - Estado vazio para categorias sem tópicos
  - 6 tópicos mock na categoria "Geral" com variações de fixado/fechado

- **Página Perfil — Dashboard** (`src/components/perfil/PerfilContent.tsx`) — Implementação completa conforme docs/paginas/09-perfil.md:
  - Header do perfil com avatar Minecraft (via mc-heads.net), username, badge de rank (VIP+) com cor, badge de reputação (Veterano), data de registro, último acesso, botão "Editar Perfil"
  - 6 cards de métricas: Moedas SAPIENS, XP Total, Tempo Online, Aulas Concluídas, Ranking Geral, Plano Atual com expiração
  - Seção "Progresso de Aulas" com barras de progresso animadas (Framer Motion) por disciplina, cores individuais, percentual e contagem
  - Toggle "Ver todas / Ver menos" para lista de disciplinas
  - Seção "Atividade Recente" com timeline de 6 ações (login, aula, fórum, compra, conquista, milestone) com ícones e cores específicas
  - Links de navegação rápida: Minhas Compras, Configurações, Meu Ranking

- **Página Perfil — Compras** (`src/components/perfil/ComprasContent.tsx`) — Implementação completa conforme docs/paginas/09-perfil.md (RN-PERFIL-02):
  - Hero com breadcrumb de 3 níveis (Home > Perfil > Compras)
  - Banner de VIP ativo com data de expiração e botão "Renovar" → /loja
  - Resumo: total gasto e número de pedidos
  - Filtro por status (Todos, Aprovados, Pendentes, Cancelados, Reembolsados)
  - Lista de 6 pedidos mock com: produto, badge de status colorido (✅ Aprovado, ⏳ Pendente, ❌ Cancelado, 🔄 Reembolsado), data, método de pagamento (PIX/Cartão/Boleto), código do pedido, valor
  - Estado vazio quando filtro não encontra resultados
  - Meta robots noindex, nofollow (página protegida)

- **Página Perfil — Configurações** (`src/components/perfil/ConfiguracoesContent.tsx`) — Implementação completa conforme docs/paginas/09-perfil.md (RN-PERFIL-03):
  - Sidebar de navegação com 5 abas: Dados Pessoais, Alterar Senha, Notificações, Privacidade, Zona de Perigo
  - **Dados Pessoais**: Username (readonly), email editável com aviso de confirmação, bio com textarea e contador de caracteres (500 max), data de nascimento (readonly)
  - **Alterar Senha**: Campos senha atual, nova senha e confirmação com validação de match, aviso de sync com nLogin/Minecraft, botão desabilitado até validação
  - **Notificações**: 4 toggles (Respostas no fórum, Lembretes de aulas, Novidades, Resumo semanal) com selects (Email/Apenas no site/Desligado)
  - **Privacidade**: 3 toggles visuais (Perfil público, Exibir tempo online, Exibir atividade) com descrições
  - **Zona de Perigo**: Seção "Desativar Conta" (preserva dados, botão amarelo) + seção "Excluir Conta Permanentemente" (input de confirmação "username CONFIRMAR", botão vermelho desabilitado até confirmação correta)
  - Animação de transição entre abas (Framer Motion)
  - Feedback visual "Salvo!" temporário em todos os botões de salvar

### Modificado

- **`src/app/cronograma/page.tsx`** — Delega renderização para CronogramaContent, metadata SEO atualizada
- **`src/app/blog/page.tsx`** — Delega renderização para BlogContent, metadata SEO atualizada
- **`src/app/loja/page.tsx`** — Delega renderização para LojaContent, metadata SEO atualizada
- **`src/app/comunidade/page.tsx`** — Delega renderização para ComunidadeContent, metadata SEO atualizada
- **`src/app/perfil/page.tsx`** — Delega renderização para PerfilContent, adicionado robots noindex
- **`src/app/perfil/compras/page.tsx`** — Delega renderização para ComprasContent, adicionado robots noindex
- **`src/app/perfil/configuracoes/page.tsx`** — Delega renderização para ConfiguracoesContent, adicionado robots noindex

### Decisões técnicas

- **Dados mock em todas as páginas**: Todas as novas páginas usam dados estáticos/mock definidos nos componentes. Serão migrados para o banco de dados via Prisma quando as respectivas APIs estiverem implementadas
- **Carrinho com state local (Map)**: O carrinho da Loja usa `useState<Map>` em memória. A persistência em localStorage (usuário deslogado) e banco de dados (usuário logado) será implementada junto com o sistema de autenticação completo
- **Navegação interna no fórum**: A Comunidade usa state local para navegar entre categorias e tópicos (sem routing). Será migrado para rotas dinâmicas `/comunidade/[categoria]` e `/comunidade/[categoria]/[topico]` quando a integração com banco estiver pronta
- **Perfil com dados mock fixos**: O dashboard do perfil exibe dados de um jogador fictício. A integração com sessão NextAuth e queries ao banco de dados do servidor será feita em versão futura
- **Páginas de perfil com noindex**: Todas as rotas `/perfil/*` têm meta robots noindex,nofollow conforme documentação (são páginas protegidas que não devem ser indexadas)
- **SectionTitle reaproveitado**: O componente `SectionTitle` já existente foi reutilizado nas novas páginas (Loja), mantendo consistência visual

### Próximos passos (v0.4+)

1. **Autenticação completa com nLogin** — Fluxo real de login/registro via API do servidor Minecraft, integração com NextAuth sessions, proteção de rotas com middleware
2. **API Routes para formulários** — Contact form (`/api/contato`), newsletter (`/api/newsletter`), carrinho/checkout
3. **Integração com banco de dados** — Migrar dados mock para queries Prisma em todas as páginas (blog, loja, comunidade, perfil, cronograma)
4. **Página de detalhe do blog** — Rota dinâmica `/blog/[slug]` com conteúdo completo, compartilhamento social, posts relacionados
5. **Integração MercadoPago** — Processamento de pagamentos para a loja (PIX, cartão, boleto) conforme docs/paginas/05-loja.md
6. **Status do servidor em tempo real** — Polling ou WebSocket para dados reais do Minecraft Server (jogadores online, TPS, plugins)
7. **Rotas dinâmicas do fórum** — `/comunidade/[categoria]` e `/comunidade/[categoria]/[topico]` com SSR e paginação
8. **Assets visuais** — Fotos da equipe, capas do blog, imagens de produtos, ícones de disciplinas
9. **Fonte Minecrafter** — Substituir Press Start 2P pela fonte customizada Minecrafter conforme design system
10. **CRUD do fórum** — Criação de tópicos, comentários, reações, denúncias, moderação
11. **Exportação de calendário** — Gerar arquivo .ics para download/integração com Google Calendar
12. **Persistência do carrinho** — localStorage para visitantes, banco de dados para usuários logados

---

## [v0.2] — 20/03/2026 — Implementação das páginas de conteúdo e autenticação

### Adicionado

- **Componente PageHero** (`src/components/ui/PageHero.tsx`) — Hero reutilizável para páginas internas: breadcrumb de navegação, título animado (Framer Motion fade-in), subtítulo opcional, gradiente de fundo
- **Componente Input** (`src/components/ui/Input.tsx`) — Input de formulário reutilizável com label, estado de erro, forwarded ref, estilização consistente com o design system
- **Componente SectionTitle** (`src/components/ui/SectionTitle.tsx`) — Título de seção animado com Framer Motion, suporte a subtítulo, centralizado por padrão
- **Página Sobre** (`src/components/sobre/SobreContent.tsx`) — Implementação completa conforme docs/paginas/02-sobre.md:
  - Timeline interativa (2020–2026) com items animados
  - Citação do fundador PH com card estilizado
  - Seção "Quem Somos" com placeholder para vídeo institucional
  - Cards de Missão, Visão e Valores com ícones
  - Grid de reconhecimento na mídia (6 veículos)
  - Grid da equipe (7 membros com avatar, nome, cargo)
  - Listagem da hierarquia do servidor (5 cargos com descrição)
- **Página Contato** (`src/components/contato/ContatoContent.tsx`) — Implementação completa conforme docs/paginas/08-contato.md:
  - 3 cards de canais de contato (WhatsApp, Email, Discord) com links diretos
  - Grid de redes sociais (7 redes com ícones e cores)
  - Formulário de contato com campos nome, email, assunto (select), mensagem (textarea), campo honeypot anti-bot
  - FAQ accordion (6 perguntas frequentes) com animação de abertura/fechamento
  - Seção de localização/horário de atendimento
- **Página Termos** (`src/components/termos/TermosContent.tsx`) — Implementação completa conforme docs/paginas/12-termos.md:
  - Toggle de abas Termos / Política de Privacidade
  - 13 seções de Termos e Condições completas
  - 8 seções de Política de Privacidade (LGPD)
  - Sidebar fixa com Table of Contents e scroll spy via IntersectionObserver
  - Botão de impressão
  - Meta de "última atualização"
- **Página Status do Servidor** (`src/components/status/StatusContent.tsx`) — Implementação completa conforme docs/paginas/10-status-servidor.md:
  - Painel de status em tempo real (fetch `/api/server-status` a cada 15s com auto-refresh)
  - Indicador online/offline com animação de pulso
  - Grid de estatísticas (jogadores, versão, MOTD, IP com botão copiar)
  - Sistema de abas de ranking (XP, Moedas, Tempo Online, Aulas) com dados mock
  - Tabela de ranking estilizada com medalhas (ouro/prata/bronze)
- **Página Aulas** (`src/components/aulas/AulasContent.tsx`) — Implementação completa conforme docs/paginas/03-aulas.md:
  - Seção "Como Funciona" com 4 cards explicativos do método gamificado
  - Catálogo de 8 disciplinas com ícone, cor, nível e quantidade de cursos
  - Barra de busca e filtro por nível (Fundamental/Médio/Todos)
  - Seção ENEM & Reforço com CTA
  - Seção informativa para pais com benefícios
- **Página Login aprimorada** (`src/components/auth/LoginContent.tsx`) — Enhacement do formulário de login:
  - Toggle de visibilidade de senha (eye icon)
  - Checkbox "Lembrar de mim"
  - Link "Esqueci a senha" para `/recuperar-senha`
  - Validação client-side, estado de loading e exibição de erros
  - Ícone Gamepad2 e título estilizado
- **Página Registro aprimorada** (`src/components/auth/RegistroContent.tsx`) — Implementação completa conforme docs/paginas/07-auth.md:
  - Campo username com validação (3-16 chars, alfanumérico + _) e indicador visual ✅/❌
  - Campo email com autoComplete
  - Campo data de nascimento com validação de idade mínima (13 anos)
  - Campo senha com toggle de visibilidade e indicador de força (5 níveis: Fraca → Muito Forte)
  - Campo confirmar senha com validação de match em tempo real
  - Checkbox de aceitar Termos e Condições (link abre em nova aba)
  - Validação completa client-side antes do submit

### Modificado

- **`src/app/sobre/page.tsx`** — Delega renderização para SobreContent (separação server/client component)
- **`src/app/contato/page.tsx`** — Delega renderização para ContatoContent
- **`src/app/termos/page.tsx`** — Delega renderização para TermosContent
- **`src/app/status/page.tsx`** — Delega renderização para StatusContent
- **`src/app/aulas/page.tsx`** — Delega renderização para AulasContent
- **`src/app/login/page.tsx`** — Delega renderização para LoginContent, mantém apenas metadata no server component
- **`src/app/registro/page.tsx`** — Delega renderização para RegistroContent, atualização da meta description

### Decisões técnicas

- **Padrão server/client component**: Todas as páginas seguem o padrão onde `page.tsx` é server component (exporta metadata) e delega para um componente `*Content.tsx` client component. Isso garante SEO via metadata estática e interatividade via client components
- **Dados mock para rankings**: A página de Status usa dados mock para a tabela de rankings. A integração com o banco de dados real será implementada quando a API de dados do servidor estiver disponível
- **Dados estáticos para disciplinas**: O catálogo de aulas usa dados estáticos definidos no componente. Serão migrados para o banco de dados via Prisma quando o CMS de aulas for implementado
- **Formulário de contato simulado**: O envio do formulário de contato simula um delay de 1s. A integração com a API de ContactMessage será implementada junto com o backend
- **Validação client-side first**: Login e Registro fazem validação completa no client antes do submit. A validação server-side será adicionada junto com as API routes de autenticação

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
