# Changelog

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

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
