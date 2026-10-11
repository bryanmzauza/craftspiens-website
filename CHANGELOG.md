# Changelog

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [v0.17] — 10/10/2026 — Loja refeita: Pix no site, planos anuais e entrega automática

### Adicionado

- **Pix no próprio site** (`src/lib/mercadopago.ts`, `POST /api/loja/pedidos`): o pagamento é criado na API de pagamentos do MercadoPago e a página `/loja/pedido/[id]` mostra o QR Code, o código copia e cola e a contagem regressiva (30 min); a confirmação aparece sozinha quando o webhook aprova. Escolha do MercadoPago: taxa percentual sem valor fixo (0,99% na tabela padrão), o que importa para itens de R$ 6; gateways com taxa fixa de R$ 0,80 levariam 13% do menor Sapiens
- **Cartão pelo Checkout Pro** à vista ou em até 3x, com boleto excluído (taxa fixa alta para itens baratos). O retorno volta direto para a página do pedido
- **Juros do parcelamento informados antes de pagar** (`src/lib/installments.ts`, `GET /api/loja/parcelas`): a página de compra mostra, para cada opção, o valor da parcela, os juros em reais e em % sobre o valor, a taxa efetiva ao mês e ao ano e o total. As taxas vêm da API de parcelas do Mercado Pago (cache de 1 h) e o cálculo reproduz o dele; abaixo do mínimo para parcelar aparece só o à vista. O pedido guarda as parcelas e o valor pago com juros (`orders.installments`, `paid_amount`), mostrados na página do pedido, em `/perfil/compras` e no e-mail de confirmação
- **Combos com cosméticos**: VIP + Cosméticos (R$ 44,90) e Premium + Cosméticos (R$ 79,90), o plano mensal com os 4 rastros e a Entrada Épica por 30 dias, por R$ 9,90 a mais (os cosméticos permanentes somam R$ 54,50). Oferecidos no card do plano mensal e na página de compra, que alterna entre o plano e o combo. O plugin aplica os cosméticos como permissão temporária, que soma ao renovar e não mexe nos permanentes
- **Compra de um produto por vez** em `/loja/comprar/[slug]` (`loja/ComprarContent.tsx`): resumo e benefícios, CPF de quem paga, cupom, Pix ou cartão e aceite dos termos (16 anos ou responsável). Um Pix ainda válido para o mesmo produto e valor é reaproveitado em vez de criar outro pedido
- **Planos anuais**: VIP Anual (R$ 350) e Premium Anual (R$ 700), pelo preço de 10 meses (2 meses grátis), com alternância Mensal/Anual na vitrine, valor equivalente por mês e economia em relação a 12 meses
- **Novo catálogo** (`scripts/seed-loja.mjs`), com os benefícios lidos dos grupos `vip`, `premium` e `vip_sg2` do LuckPerms do servidor e as aulas exclusivas como primeiro benefício do Premium (no VIP, aparecem como não incluídas):
  - VIP R$ 35 e Premium R$ 70 por 30 dias (`lp user {uuid} parent addtemp <grupo> 30d accumulate`: renovar soma ao tempo que falta)
  - Sapiens: 1M por R$ 6, 3M por R$ 15 e 20M por R$ 70, creditados quando o jogador está online
  - Cosméticos permanentes que funcionam no Java e no Bedrock: Rastro de Chamas, Corações, Notas Musicais e Estrelas (R$ 9,90) e Entrada Épica (R$ 14,90), dados por permissão global no LuckPerms
  - Produtos de exemplo das versões anteriores são desativados pelo seed (não apagados, por causa dos pedidos)
- **Verificação da conta do jogo** (`src/lib/game-account.ts`, `GET /api/loja/conta-jogo`): antes de aceitar o pagamento, o site confere que a conta vinculada existe no nLogin e identifica a edição (Bedrock quando há `bedrock_id`; Java nos demais casos). A página de compra mostra o nick e a edição que vão receber; conta inexistente responde `ContaJogoNaoEncontrada`
- **Fila de entregas** (`src/lib/deliveries.ts`, tabela `deliveries`): ao aprovar o pagamento, o webhook cria uma entrega por item com o que foi comprado (slug, categoria, quantidade, dias) e para quem (nick, UUID, edição, `mojang_id`, `bedrock_id`); o estorno cria entregas do tipo REVOKE. O site não guarda nem executa comandos: o plugin do lobby decide
- **API do plugin do lobby** com token (`DELIVERY_API_TOKEN`): `GET /api/loja/entregas?servidor=&online=&limite=` reserva as entregas pendentes de forma atômica (`FOR UPDATE SKIP LOCKED`) e `POST /api/loja/entregas/[id]` confirma o resultado (`ok`, falha, ou `aguardarJogador` para itens que precisam do jogador online, como Sapiens); reservas sem confirmação em 10 min voltam para a fila e 5 falhas marcam FAILED
- **Briefing do plugin de entregas** (`docs/plugin-entregas.md`): contexto da rede (Velocity, LuckPerms compartilhado, Java e Bedrock), contrato da API, tabela slug para comando, configuração, comandos, especificação dos cosméticos com partículas que o Geyser traduz e critérios de aceite
- Vitrine refeita (`loja/LojaContent.tsx`): "Como funciona" em 3 passos, seções Planos, Sapiens e Cosméticos (selo Java e Bedrock) e perguntas frequentes
- Página do pedido com o estado da entrega (na fila, ao entrar no servidor, entregando, entregue, precisa de atenção); `/perfil/compras` mostra planos ativos com validade acumulada por família (VIP, Premium), o estado da entrega de cada pedido e o botão "Pagar" para pedidos pendentes
- Campos `orders.pix_code`, `pix_qr_base64`, `pix_expires_at`, `checkout_url`, `paid_at`, `installments`, `paid_amount`; enums `PlayerPlatform`, `DeliveryKind` e `DeliveryStatus`
- Variável opcional `DELIVERY_API_TOKEN` (`openssl rand -hex 32`); sem ela a API de entregas responde 503 e a fila espera

### Alterado

- O webhook grava `paid_at`, cria as entregas e, em estornos, as remoções; o e-mail de confirmação orienta a entrar no lobby para receber
- `payment_method` guarda `pix` ao criar o Pix e, depois do webhook, o método informado pelo MercadoPago
- Testes locais com o Mercado Pago: sem HTTPS em `AUTH_URL` o pagamento é criado sem `notification_url` (o Mercado Pago recusa `localhost`) e vale a URL de teste do painel; a variável opcional `MERCADOPAGO_TEST_PAYER_EMAIL` troca o pagador pela conta de teste compradora fora de produção
- Rate limits: 8 pedidos por 15 min e 120 consultas de pedido por 5 min (`orderPoll`)
- O `proxy.ts` protege `/loja/comprar` e `/loja/pedido` e exige e-mail confirmado em `/api/loja/pedidos`
- A migração do MariaDB (`scripts/migrate-v13.mjs`) copia os cupons sempre inativos, porque os do banco antigo são de teste
- Documentação da loja reescrita (`docs/paginas/05-loja.md`, `docs/stack-tecnica.md`), com o passo do plugin e da chave Pix em `docs/arquitetura-producao.md`; guia das credenciais, webhook e contas de teste do Mercado Pago em `docs/mercadopago.md`
- Arquitetura de produção (`docs/arquitetura-producao.md`): o Next.js passa a rodar no servidor físico, junto dos bancos, e a VPS (Oracle Always Free, 1 núcleo e 500 MB) fica só com nginx e WireGuard, repassando as requisições pelo túnel. As consultas ao banco ficam locais e o PostgreSQL passa a ouvir só em `127.0.0.1`. A VPS mostra uma página de manutenção (503) quando o site não responde. Também entram as regras de rede e de iptables da Oracle, os limites de memória e CPU do serviço do site e a regra de cache da Cloudflare para `/_next/image`

### Removido

- Carrinho: páginas `/loja/carrinho` e `/loja/checkout`, rotas `/api/carrinho` e `/api/loja/checkout`, tabela `cart_items` e as páginas `/loja/pedido/sucesso`, `pendente` e `falha` (substituídas por `/loja/pedido/[id]`)
- Coluna `products.server_command` (o plugin decide os comandos pelo slug do produto)

> Para aplicar: `npm run db:push:pg` (remove `cart_items` e `server_command`, cria `deliveries` e as colunas `installments` e `paid_amount` em `orders`), `npm run db:seed:loja` (cria os combos), `DELIVERY_API_TOKEN` no `.env`, chave Pix cadastrada na conta do MercadoPago e o plugin do lobby com os mesmos slugs.

---

## [v0.16] — 10/10/2026 — Aulas do YouTube, login externo e status do servidor

### Adicionado

- **Login pela conta Microsoft** (Minecraft Java original e Bedrock), em `src/lib/minecraft-auth.ts`:
  - Fluxo oficial dos launchers: conta Microsoft, Xbox Live (XUID e gamertag) e API do Minecraft (UUID e nick do Java)
  - A conta do jogo é encontrada pelo identificador oficial no nLogin: `mojang_id` (Java original) ou `bedrock_id` (UUID do Floodgate gerado a partir do XUID)
  - Só entra quem já tem conta no servidor; não cria contas do jogo. A conta do site é criada no primeiro acesso, como no login por senha
  - A etapa do Java depende de a Mojang aprovar o app do Azure para a API do Minecraft; até lá, o login funciona para Bedrock
- **Login e cadastro pelo Google**: cria uma conta no site sem nick. O e-mail do Google precisa estar verificado, e se o e-mail já pertence a uma conta com e-mail confirmado, o Google é vinculado a ela automaticamente; com e-mail ainda não confirmado, o dono entra com nick e senha e confirma o e-mail antes
- **Aba "Contas vinculadas"** em Configurações (`perfil/ContasVinculadas.tsx`):
  - Vincular nick do Minecraft confirmando a senha do servidor (`POST /api/perfil/vinculos/nick`); nick de conta original é recusado e vinculado pela Microsoft
  - Vincular e desvincular o Google; desvincular só é permitido se a conta tiver outra forma de entrar
  - Vínculo pela Microsoft para quem joga com conta original ou Bedrock
  - Intenção de vínculo em cookie assinado, válido por 10 minutos (`src/lib/link-intent.ts`)
- **Confirmação de e-mail obrigatória** (`/confirmar-email`, `src/lib/email-verification.ts`):
  - Toda conta sem e-mail confirmado precisa informar um e-mail e confirmar com um código de 6 dígitos antes de usar a plataforma; as páginas públicas continuam abertas
  - Vale para login por nick e senha, cadastro pelo site e Microsoft; contas do Google já entram confirmadas, e contas com e-mail provisório (`@craftsapiens.temp`) precisam informar um e-mail real
  - Alternativa ao código: **Confirmar com Google**, que vincula o Google à conta e adota o e-mail dele como confirmado (não vale para troca de e-mail nem para e-mail que já pertence a outra conta)
  - Código válido por 15 minutos, com 5 tentativas; só o hash do código fica no banco; pedir um novo código invalida os anteriores
  - Rotas `GET /api/conta/email`, `POST /api/conta/email/enviar` e `POST /api/conta/email/confirmar`, com limites de 5 códigos e 10 tentativas a cada 15 minutos
  - O `proxy.ts` leva páginas que exigem conta para a confirmação e bloqueia as APIs de escrita (perfil, carrinho, checkout, cupons, fórum e progresso das aulas) com o código `EmailNaoVerificado`
  - E-mail com o código (`sendEmailVerificationCode`); em desenvolvimento, se o SMTP falhar, o código aparece no terminal
- **CPF de quem paga no checkout** (`src/lib/cpf.ts`): obrigatório para comprar, pode ser do aluno ou de um responsável, validado pelos dígitos verificadores, salvo na conta e enviado ao MercadoPago como identificação do pagador
- **Envio de e-mails pelo Gmail com o domínio próprio** (guia em `docs/email.md`):
  - Envio pelo SMTP do Gmail (`smtp.gmail.com:465`, senha de app), com remetente `nao-responda@craftsapiens.com.br` cadastrado em "Enviar e-mail como"
  - Recebimento pelo Cloudflare Email Routing, encaminhando `contato@` e `nao-responda@craftsapiens.com.br` para o Gmail da equipe, que responde como `contato@`
  - O e-mail do domínio deixa de usar a hospedagem antiga; o guia lista os registros de DNS a remover e mantém o DMARC em `p=none` enquanto o envio for pelo Gmail
  - Variáveis `SMTP_FROM_NAME`, `SMTP_REPLY_TO` (para onde vão as respostas aos e-mails automáticos) e `CONTACT_INBOX` (caixa da equipe)
  - Mensagens do formulário de contato encaminhadas para `CONTACT_INBOX`, com resposta direta para quem escreveu
  - Script `npm run email:test` para conferir conexão, autenticação e entrega
- Tabela `email_verifications` e campos `users.email_verified_at` e `users.payer_cpf`
- Tabela `linked_accounts` e campos `users.display_name`; `users.nlogin_id` passa a aceitar nulo (conta criada pelo Google, ainda sem nick)
- Variáveis opcionais `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_MICROSOFT_ID` e `AUTH_MICROSOFT_SECRET`; sem elas, os botões correspondentes não aparecem
- **Status do servidor ao vivo** (`src/lib/minecraft-status.ts`):
  - Consulta direta ao servidor pelo protocolo Server List Ping, resolvendo o registro SRV do domínio (o servidor está na porta 25576, não na 25565); se o DNS do sistema não responder à consulta SRV, usa DNS públicos
  - API pública mcsrvstat.us como reserva, agora com User-Agent (sem ele a API responde 403)
  - Cache de 15 s no servidor; o navegador atualiza a cada 30 s com uma única consulta compartilhada entre os componentes (`src/lib/use-server-status.ts`) e pausa quando a aba não está visível
  - Versão exibida como faixa de versões aceitas (ex.: "1.7.2 – 26.3"), sem o nome do proxy
- **Indicador de jogadores online na navbar** (`ServerStatusBadge`), em todas as páginas, com link para `/status`
- **Acesso Java e Bedrock na página de status** (`status/HowToConnect.tsx`): seção "Como entrar" com o endereço do servidor para as duas edições, a porta do Bedrock (19132, constante `BEDROCK_PORT`), botões de copiar e o passo a passo de cada edição; o painel de status passa a indicar "Java e Bedrock" como edições aceitas
- **Faixa do Discord no rodapé**, no lugar da inscrição na newsletter por e-mail: convite para o servidor do Discord com o número de membros e de pessoas online, vindos da API pública de convites do Discord (`/api/discord`, cache de 10 min)
- **Página Sobre refeita** (`sobre/SobreContent.tsx`, conteúdo em `src/content/sobre.ts`):
  - Hero com a imagem do campus e números reais (início em 2020, média de alunos por aula e membros no Discord ao vivo)
  - Linha do tempo com marcos confirmados pela imprensa, no lugar dos marcos genéricos
  - Seção "Na imprensa" com 8 matérias clicáveis e conferidas, com destaque para a reportagem da Folha de S.Paulo (20/03/2026); saíram os itens sem link verificável
  - Equipe agrupada em Direção, Professores e Equipe, pronta para receber fotos (`public/equipe/`), com os membros citados pela Folha incluídos
  - Hierarquia em formato de pirâmide, com os professores à parte da cadeia de moderação
  - Convite para entrar na equipe pelo Discord

- **Perfil com dados do servidor:**
  - Foto do perfil com a skin do jogo: conta original pelo UUID da Mojang, Bedrock pela textura publicada pelo Geyser e as demais pelo nick (`src/lib/player-profile.ts`)
  - Cargo vindo do LuckPerms: grupo de maior peso, com nome e cor do prefixo do jogo (`src/lib/luckperms.ts`, somente leitura)
  - Tag Novato, Membro, Veterano ou Lenda pela data de registro no nLogin, e "No servidor desde" no lugar de "Membro desde"
  - Selo "Verificado" no perfil e no campo de e-mail de Configurações; o campo mostra "Não confirmado" e o link para confirmar quando falta
- **Google e Microsoft confirmam o e-mail:** entrar ou vincular pelo Google confirma o e-mail da conta Google, inclusive para vínculos feitos antes; a Microsoft passa a pedir os escopos `openid email` e confirma o e-mail de contas pessoais. O vínculo pela Microsoft fica registrado em `linked_accounts`, e Contas vinculadas mostra "Verificado pela Microsoft" e "Verificado pelo Google"
- **Aulas com os vídeos do canal no YouTube:** a página `/aulas` passa a listar os 1013 vídeos e lives públicos do canal (938 lives, 25 vídeos e 50 vídeos curtos, de 2021 a 2026), separados em 26 disciplinas:
  - `npm run aulas:youtube` (`scripts/youtube-sync.mjs`) lista as abas Vídeos e Ao vivo do canal com o yt-dlp e grava `scripts/data/youtube-videos.json`; só os vídeos novos são consultados um a um para obter a data de publicação
  - A matéria vem do título do vídeo (`scripts/lib/youtube-aulas.mjs`), inclusive com os erros de digitação que aparecem no canal; um vídeo pode entrar em mais de uma disciplina (ex.: "Inglês/Espanhol", "Química - ENEM"). O conteúdo que não é aula (tutoriais, eventos, Survival Geopolítico) fica em "Servidor e Comunidade"; a lista `OVERRIDES` permite reclassificar vídeos pelo id
  - Lives com título genérico ("[LIVE] Aula no Minecraft"): 158 das 168 receberam o título transcrito da miniatura, com matéria e tema (`scripts/lib/youtube-titulos.mjs`), exibido no site e usado na classificação; as 10 com miniatura sem texto ficam em "Outras Aulas"
  - `npm run aulas:atualizar` (sync e seed em sequência), com timer do systemd a cada 3 horas em produção (`docs/arquitetura-producao.md`, seção 6.6). A lista pode ser gravada fora do repositório (`AULAS_YOUTUBE_FILE`) para não travar o `git pull`; lives em andamento ou agendadas são ignoradas, nada é gravado se a lista vier com menos de 80% dos vídeos anteriores (`--forcar` para aceitar) e vídeos sem data consultável entram com a data da sincronização
  - `npm run db:seed:aulas` grava disciplinas e aulas a partir desse arquivo, insere as novas em lote e atualiza só as que mudaram
  - Página da disciplina com grade de vídeos (miniatura, formato, duração e data), busca pelo título, filtro por formato, ordem por data e carregamento em blocos de 24
  - Página da aula com o vídeo incorporado (`youtube-nocookie.com`), data de transmissão e link para o YouTube
  - Seção "Aulas recentes" em `/aulas` (`GET /api/aulas/recentes`), sem repetir vídeos que estão em mais de uma disciplina
  - Campos `lessons.youtube_id`, `lessons.format`, `lessons.published_at` e `disciplines.area`

### Alterado

- Contas sem nick vinculado não compram na loja (a entrega é no jogo) nem publicam no fórum (o autor aparece pelo nick); a API responde com o código `SemNick` e a orientação para vincular
- Contas sem nick: a troca e a redefinição de senha orientam a vincular um nick; a exclusão de conta é confirmada digitando EXCLUIR
- A sessão é revalidada quando o cliente chama `update()` e passa a atualizar o nick vinculado; ela também carrega se o e-mail está confirmado (`emailConfirmed`)
- A troca de e-mail em Configurações passa pela confirmação por código; `PUT /api/perfil` não altera mais o e-mail
- E-mails automáticos passam a ter versão em texto, `Reply-To` e nova tentativa em falhas temporárias do SMTP; o rodapé convida a responder quando há `SMTP_REPLY_TO`
- Remetente padrão passa de `noreply@` para `nao-responda@craftsapiens.com.br`
- O assunto do formulário de contato passa a ter limite de 3 a 150 caracteres
- Card "Plano Atual" do perfil passa a ser "Cargo"; a tag de reputação do fórum sai do cabeçalho do perfil
- O checkout exige e-mail confirmado, e o botão de adicionar ao carrinho leva à confirmação quando falta
- Contas sem nick não aparecem no ranking de aulas
- `getNloginById`, `getNloginsByIds` e o novo `getNloginMap` aceitam contas sem nick; as rotas do blog e do fórum usam `getNloginMap` para resolver autores
- `MINECRAFT_SERVER_PORT` passa a ser opcional e não deve ser definida quando o domínio tem registro SRV
- O fundo global de partículas também não é montado na página Sobre
- Aulas: o filtro por nível (Fundamental/Médio) dá lugar ao filtro por área (Exatas, Natureza, Humanas, Linguagens, Outras); os cards de disciplina mostram a área e as horas de conteúdo, inclusive na home. A busca de disciplinas deixa de diferenciar maiúsculas
- O slug da aula passa a ser único por disciplina (`@@unique([disciplineId, slug])`). O `npm run db:push:pg` avisa sobre a nova restrição e pede `--accept-data-loss`; não há perda de dados, porque os slugs já eram únicos
- Ícones das disciplinas centralizados em `src/lib/discipline-icons.ts` (as páginas de aulas tinham cópias próprias), com ícones para as novas disciplinas

### Corrigido

- Página de confirmação de e-mail presa depois do código certo: o `update()` sem argumento só relia a sessão, sem revalidar no servidor, e o proxy devolvia para a confirmação por até 1 minuto. Contas sem e-mail confirmado agora são revalidadas a cada requisição. O mesmo atraso afetava o nick vinculado em Contas vinculadas
- Avatar do perfil mostrava o Steve para todos: usava o `unique_id` do nLogin, que é o UUID offline do jogo e não tem skin
- Status do servidor sempre "offline": a rota forçava a porta 25565, ignorando o registro SRV, e a API externa recusava a requisição sem User-Agent
- Contador da faixa de números não acompanhava as atualizações depois da animação inicial
- Links do Discord quebrados em todo o site e nos e-mails: o encurtador discord.io encerrou o serviço; o link passa a ser o convite oficial `discord.gg/craftsapiens`
- Ícone do Discord incompleto (sem os olhos) nos ícones sociais
- IP do servidor ultrapassando a caixa na página de status

### Removido

- Formulário de inscrição na newsletter no rodapé (as rotas `/api/newsletter` e a página de confirmação continuam no código, sem uso na interface)
- Cartão de MOTD no painel da página de status
- As 25 aulas de exemplo do seed e a disciplina Educação Física, sem vídeos no canal (o seed as desativa, sem apagar progresso)

---

## [v0.15] — 09/10/2026 — Nova página inicial

### Adicionado

- **Hero com imagem do campus** (`src/assets/home/hero.webp`, 1983 px, 255 KB, importada estaticamente: o `next/image` gera a URL com hash, as versões menores e a miniatura de carregamento):
  - Zoom lento contínuo, parallax de rolagem e do ponteiro, luz pulsando e partículas subindo; tudo desativado com `prefers-reduced-motion`
  - Enquadramento por orientação: em telas em pé a imagem fica no topo e o texto abaixo; em telas largas cobre o hero inteiro (variante `stacked` no Tailwind)
  - Status do servidor ao vivo no cabeçalho do hero e IP do servidor com botão de copiar
  - Miniatura desfocada exibida enquanto a imagem carrega
- **Seção de disciplinas** na home com dados reais de `/api/aulas` (até 8, oculta quando não há disciplinas)
- `src/lib/discipline-icons.ts` — mapa compartilhado de ícones das disciplinas
- Propriedade `size="lg"` no componente `Button`
- **Identidade visual**: ícone da marca ao lado do nome na navbar e no rodapé (`src/assets/brand/logo.webp`), Moeda SAPIENS com fundo transparente ilustrando o item correspondente da home (`src/assets/brand/moeda-sapiens.webp`) e favicon, `icon.png` e `apple-icon.png` gerados a partir do logo (substituem o ícone padrão do Next)

### Alterado

- **Home reestruturada**: hero, "O projeto" (lista numerada), disciplinas, "Como funciona" (passos ligados por linha), faixa de números e CTA final sobre a imagem escurecida
- Textos da home revisados; títulos de seção menores e rótulos em fonte mono
- O fundo global de partículas não é montado na home
- `docs/paginas/01-home.md` descreve a implementação atual

### Removido

- `home/FeaturesSection.tsx` (substituída por `IntroSection.tsx`) e o card decorativo do hero antigo

---

## [v0.14.1] — 09/10/2026 — Arquitetura de produção e revisão de textos

### Adicionado

- **`docs/arquitetura-producao.md`** — arquitetura de produção:
  - Site em VPS dedicada atrás da Cloudflare; PostgreSQL (Docker) e MariaDB do Pterodactyl no servidor físico
  - Túnel WireGuard exclusivo (`wg-site`) entre a VPS do site e o servidor físico
  - Usuário próprio no MariaDB com permissões só na tabela `nlogin`
  - nginx com IP real vindo da Cloudflare, firewall liberando a porta 443 só para a Cloudflare
  - Serviço systemd, ordem da primeira instalação, deploy de atualizações e rollback
  - Backup diário criptografado do PostgreSQL no Google Drive (rclone), restauração e teste mensal
  - Diagnóstico de problemas comuns e checklist de validação

### Alterado

- **README** e **`docs/stack-tecnica.md`** — seção de produção aponta para a nova arquitetura (o PostgreSQL não fica mais na VPS)
- **Revisão de textos em todo o projeto**: emojis removidos da documentação, do CHANGELOG, dos e-mails, das mensagens dos scripts e da interface; linguagem da documentação revisada para um tom neutro e direto
- **Ícones das categorias do fórum** passam a ser nomes de ícones do Lucide (ex.: `Megaphone`), no mesmo padrão das disciplinas (`src/components/comunidade/CategoryIcon.tsx`). O `seed-forum` grava os novos valores e o `migrate-v13` converte os emojis antigos
- **Equipe (página Sobre)**: avatares com as iniciais do nome no lugar de emojis
- **Selos de reputação** (fórum e perfil): exibem só o nome do nível

---

## [v0.14] — 08/10/2026 — Higienização pré-produção e segurança

### Adicionado

- **Validação de variáveis de ambiente** (`src/lib/env.ts` + `src/instrumentation.ts`):
  - Schema zod para `AUTH_*`, `POSTGRES_URL`, `DATABASE_URL`, `MERCADOPAGO_*`, `SMTP_*` e `MINECRAFT_SERVER_*`
  - Em produção o servidor não atende requisições se alguma variável obrigatória faltar; o erro lista todas de uma vez, com dicas de renomeação (`NEXTAUTH_URL` → `AUTH_URL`, `NEXTAUTH_SECRET` → `AUTH_SECRET`, `SMTP_PASSWORD` → `SMTP_PASS`)
  - Validação preguiçosa: o `next build` não depende das variáveis de produção

- **Rate limiting no PostgreSQL** (`src/lib/rate-limit.ts`, tabela `rate_limits`):
  - Incremento atômico (`INSERT … ON CONFLICT`), compartilhado entre instâncias e persistente entre deploys
  - IP do cliente lido só do `X-Real-IP` definido pelo nginx (`src/lib/client-ip.ts`)
  - Login limitado por IP (20/15 min) e por conta (5/15 min)
  - Novos limites em verificação de username, validação de cupom, carrinho, reações do fórum, redefinição de senha, atualização de perfil e exclusão de conta

- **Revogação de sessões** — campo `users.session_version`:
  - O token JWT é revalidado contra o banco a cada minuto (role, conta ativa e versão da sessão)
  - Trocar ou redefinir a senha e desativar a conta encerram todas as sessões abertas

- **Headers de segurança** (`next.config.ts`): Content-Security-Policy, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy e Cross-Origin-Opener-Policy; `no-referrer` nas páginas cujo link carrega token

- **Novas APIs com dados reais:**
  - `GET /api/loja/produtos` — catálogo vindo do banco (sem expor `server_command`)
  - `GET /api/ranking` — top 10 de aulas concluídas (contas ativas com perfil público)
  - `GET /api/perfil/atividade` — compras aprovadas, tópicos, comentários e aulas concluídas do usuário
  - `GET /api/estatisticas` — total de alunos e de aulas ativas

- **Scripts de banco** no `package.json`: `db:generate`, `db:push:pg`, `db:seed` (e `db:seed:aulas|blog|forum|loja`), `db:migrate-v13`, `typecheck`
- **`scripts/seed-loja.mjs`** — catálogo inicial da loja (dados de exemplo, revisar antes da produção)
- **Aviso por email** ao endereço antigo quando o email da conta é alterado
- **`docs/padrao-de-commits.md`** — padrão das mensagens de commit, versionamento e checklist antes de commitar

### Alterado

- **Webhook do MercadoPago** (`api/loja/webhook`):
  - Assinatura `x-signature` obrigatória, comparada em tempo constante e com janela de 10 minutos
  - Pedido localizado só pelo `external_reference` do pagamento (removido o `?orderId` da URL de notificação)
  - Aprovação exige moeda BRL e valor pago maior ou igual ao total do pedido
  - Processamento idempotente: notificações repetidas não baixam estoque nem reenviam email, e o status nunca regride
  - Estoque limitado nunca fica negativo; só os itens comprados saem do carrinho
- **Checkout**: preço unitário com desconto calculado antes de criar o pedido, então o total gravado é exatamente o valor cobrado
- **Troca de email** exige a senha atual e normaliza o endereço em minúsculas; registro e login também normalizam o email
- **Redefinição de senha**: o token é reivindicado de forma atômica (não pode ser usado duas vezes em paralelo) e liberado de novo se a atualização no nLogin falhar
- **Sessão** passa de 30 para 7 dias
- **Loja, Status, Perfil e Home** passam a usar dados reais (produtos, ranking, atividade, estatísticas e jogadores online)
- **VIPs** viram compra única com duração (`/N dias`), não mais "/mês"
- **Clientes Prisma e MercadoPago** criados na primeira utilização; `new PrismaPg({ connectionString })` corrige a `POSTGRES_URL` que era ignorada
- **SMTP** exige STARTTLS na porta 587
- **`scripts/migrate-v13.mjs` reescrito**: mapeamento explícito MariaDB → PostgreSQL, modo `--dry-run`, verificação de contagens e falha em qualquer erro
- **Seeds** (`seed-aulas`, `seed-blog`, `seed-forum`) agora gravam no PostgreSQL via Prisma, com `upsert` por slug
- **docker-compose**: porta corrigida para `127.0.0.1:5454:5432`
- **Documentação** (README, `docs/stack-tecnica.md`, páginas) atualizada para a arquitetura dual-database, VPS + nginx e variáveis `AUTH_*` / `SMTP_PASS`
- WhatsApp e Discord centralizados em `src/lib/constants.ts`

### Corrigido

- Erros de TypeScript em `lib/prisma.ts` e na rota do NextAuth
- 4 erros de lint `react-hooks/set-state-in-effect` (Navbar, resultado do pedido, confirmação de newsletter, termos) e variáveis sem uso
- Redirecionamento aberto no parâmetro `?redirect=` do login
- Contagem de aulas concluídas não era atualizada ao desmarcar uma aula
- Requisições extras e redundantes na página de disciplina
- Log de hash não reconhecido não registra mais caracteres do hash

### Removido

- Dados fictícios exibidos como reais: rankings, atividade do perfil, depoimentos, números fixos da home e produtos da loja com IDs inexistentes
- Placeholder de vídeo na página Sobre
- Scripts obsoletos que gravavam no MariaDB: `create-tables.mjs`, `migrate-v08` a `migrate-v12` (incluindo os cupons de teste)
- Clientes Prisma gerados do controle de versão (`/src/generated/` agora é ignorado)
- Componente `ui/Input.tsx` sem uso, constantes `SITE_NAME`/`SITE_SLOGAN` e SVGs padrão do Next.js em `public/`
- Host e porta do banco de produção citados no changelog
- Localização geográfica do site (rodapé, página de contato, copyright, metadados e documentação)

### Decisões técnicas

- **CSP sem nonce**: mantém as páginas estáticas; nonce exigiria renderização dinâmica em todas as rotas
- **Rate limit no PostgreSQL** em vez de Redis: não adiciona um serviço novo à VPS
- **Reativação no login** mantida para contas desativadas; a segurança vem do `session_version`, que derruba as sessões existentes
- **Pendências de risco médio** registradas para a próxima versão: confirmação da troca de email por link, exclusão de conta com histórico (anonimização), uso de cupom contado na aprovação, sanitização do markdown do blog e do HTML das aulas, entrega automática de itens no servidor

---

## [v0.13] — Migração para PostgreSQL (Dual Database)

### Adicionado

- **Docker Compose** para PostgreSQL 17 Alpine (desenvolvimento local):
  - Container `craftsapiens-postgres` na porta 5454
  - Volume persistente `pgdata`
  - Credenciais: `craftsapiens` / `craftsapiens_dev`

- **Schema PostgreSQL** (`prisma/schema.pg.prisma`):
  - Todos os modelos do site (User, Profile, Product, Order, Post, Comment, BlogPost, Discipline, Lesson, etc.)
  - Gerador separado em `src/generated/prisma-pg`
  - Config separada em `prisma.pg.config.ts`

- **Funções auxiliares cross-database** em `lib/nlogin.ts`:
  - `getNloginById(id)` — busca nlogin individual no MariaDB
  - `getNloginsByIds(ids)` — busca batch de nlogins (evita N+1)
  - `enrichUsersWithNlogin(users)` — enriquece lista de users com dados nlogin

- **Script de migração** (`scripts/migrate-v13.mjs`):
  - Migra dados de todas as tabelas do MariaDB para PostgreSQL
  - Suporte a ON CONFLICT DO NOTHING (idempotente)
  - Mapeamento completo de colunas snake_case → camelCase

### Alterado

- **Arquitetura de banco de dados**: MariaDB agora é usado **apenas** para a tabela `nlogin` (autenticação Minecraft). Todos os outros dados (usuários, perfis, loja, fórum, blog, aulas) estão no **PostgreSQL**.

- **Prisma schemas**:
  - `prisma/schema.prisma` → apenas modelo Nlogin (MariaDB, output `prisma-mariadb`)
  - `prisma/schema.pg.prisma` → todos os outros modelos (PostgreSQL, output `prisma-pg`)

- **`lib/prisma.ts`** reescrito com exports duplos:
  - `prisma` → PrismaClient PostgreSQL (via `@prisma/adapter-pg`)
  - `prismaMariaDb` → PrismaClient MariaDB (via `@prisma/adapter-mariadb`)

- **`lib/nlogin.ts`** — todas as operações nlogin agora usam `prismaMariaDb`, operações de user usam `prisma` (PG). `findUserByEmail` faz join manual cross-database.

- **APIs atualizadas** para remover `include: { nlogin: ... }` e usar queries separadas:
  - `api/auth/redefinir-senha` — operações sequenciais ao invés de `$transaction` cross-DB
  - `api/auth/recuperar-senha` — `getNloginById` para dados do nlogin
  - `api/blog/[slug]` e `api/blog` — batch nlogin resolution para autores
  - `api/forum/categorias` — nlogin batch para autores de últimos tópicos
  - `api/forum/topicos` e `api/forum/topicos/[slug]` — nlogin batch/individual para autores
  - `api/forum/comentarios` — nlogin batch para autores de comentários e respostas
  - `api/perfil` — `getNloginById` para dados do perfil
  - `api/perfil/conta` — `prismaMariaDb` para verificação de senha e confirmação
  - `api/perfil/senha` — `prismaMariaDb` para verificação e atualização de senha
  - `api/loja/webhook` — `getNloginById` para username em email de confirmação

- **`docs/stack-tecnica.md`** — atualizado com arquitetura dual-database, diagrama, comandos Prisma, variáveis de ambiente

### Dependências

- Adicionado: `@prisma/adapter-pg`, `pg`, `@types/pg`
- Mantido: `@prisma/adapter-mariadb`, `mariadb` (para nLogin)

---

## [v0.12] — Conteúdo de aulas e tracking de progresso

### Adicionado

- **API de Detalhe de Aula** (`GET /api/aulas/[slug]/[lessonSlug]`):
  - Retorna dados completos da aula: título, descrição, conteúdo HTML, objetivos, URL de vídeo
  - Inclui informações da disciplina (nome, slug, cor, ícone)
  - Navegação prev/next entre aulas da mesma disciplina (ordenadas por `order`)
  - Total de aulas da disciplina para contexto
  - Status de conclusão da aula (quando autenticado)

- **API de Progresso** (`GET /api/aulas/progresso`):
  - Retorna progresso agrupado por disciplina (total de aulas, concluídas) para o usuário autenticado
  - Inclui slug e cor de cada disciplina

- **API de Toggle de Conclusão** (`POST /api/aulas/progresso`):
  - Marca/desmarca aula como concluída (toggle)
  - Atualiza automaticamente `profile.aulasConcluidas` com contagem total
  - Validação de existência da aula

- **API de Detalhe de Progresso** (`GET /api/aulas/progresso/detalhe`):
  - Retorna lista de IDs de aulas concluídas para uma disciplina específica
  - Filtro por `disciplineId` via query param

- **Componente LessonContent** (`src/components/aulas/LessonContent.tsx`):
  - Player de vídeo (iframe responsivo) com placeholder quando sem URL
  - Renderização de conteúdo HTML da aula
  - Lista de objetivos de aprendizagem
  - Navegação entre aulas (anterior/próxima)
  - Sidebar com informações da disciplina e duração
  - Botão de toggle de conclusão (CheckCircle animado)
  - CTA para login quando não autenticado
  - Link para cronograma

- **Página de Aula** (`src/app/aulas/[slug]/[lessonSlug]/page.tsx`):
  - Server component com `generateMetadata` dinâmico (título e descrição da aula)
  - Renderiza LessonContent com slugs da disciplina e aula

- **Model UserLessonProgress** no Prisma:
  - Tracks conclusão de aulas por usuário
  - Constraint unique `[userId, lessonId]`
  - Relações com User e Lesson
  - Mapeado para `website_user_lesson_progress`

- **Migration v0.12** (`scripts/migrate-v12.mjs`):
  - ALTER TABLE `website_lessons`: adiciona colunas `content` (LONGTEXT), `video_url` (VARCHAR 500), `objectives` (TEXT)
  - CREATE TABLE `website_user_lesson_progress` com foreign keys e índices

### Modificado

- **Schema Prisma** (`prisma/schema.prisma`):
  - Lesson: adicionados campos `content` (LongText), `videoUrl` (VarChar 500), `objectives` (Text)
  - Lesson: adicionada relação `progress` com UserLessonProgress
  - User: adicionada relação `lessonProgress` com UserLessonProgress

- **DisciplinaContent** (`src/components/aulas/DisciplinaContent.tsx`):
  - Aulas agora são links clicáveis para `/aulas/[slug]/[lessonSlug]`
  - Indicador visual de aula concluída (ícone CheckCircle verde)
  - Barra de progresso na sidebar mostrando X/Y aulas concluídas
  - Fetch de progresso detalhado por disciplina via API

- **PerfilContent** (`src/components/perfil/PerfilContent.tsx`):
  - Removidos dados mock (`MOCK_PROGRESS`)
  - Progresso real via `GET /api/aulas/progresso`
  - Cards de progresso são links para a página da disciplina
  - Estado vazio com mensagem e CTA para página de aulas

- **Seed de Aulas** (`scripts/seed-aulas.mjs`):
  - Todas as 26 aulas agora incluem conteúdo HTML, objetivos (JSON array) e campo videoUrl
  - Query INSERT atualizada com novas colunas

### Decisões técnicas

- **Conteúdo HTML com dangerouslySetInnerHTML**: O conteúdo das aulas é armazenado como HTML no banco e renderizado diretamente. O HTML é gerado internamente (seed/admin), não por input de usuário, eliminando risco de XSS. Uma futura migração para MDX ou editor WYSIWYG pode ser considerada.
- **Toggle de progresso idempotente**: O POST em `/api/aulas/progresso` verifica existência do registro e faz create/delete conforme necessário, garantindo que múltiplos cliques não criem duplicatas.
- **Contagem de progresso em Profile**: O campo `aulasConcluidas` em Profile é atualizado a cada toggle, evitando queries de contagem em cada renderização do perfil.
- **Navegação prev/next por order**: A navegação entre aulas usa o campo `order` da Lesson para determinar anterior/próxima dentro da mesma disciplina, garantindo ordem consistente.
- **Progresso detalhe separado**: A API `/progresso/detalhe` retorna apenas IDs de aulas concluídas para uma disciplina, otimizando o fetch no DisciplinaContent (evita carregar dados de todas as disciplinas).

### Próximos passos (v0.13+)

- **Player de vídeo real** — Integração com YouTube/Vimeo embed ou player customizado com controles de velocidade
- **Exercícios interativos** — Quizzes e desafios vinculados às aulas com correção automática
- **Notificações in-app** — Sistema de notificações para novos conteúdos, promoções, respostas no fórum e atualizações do servidor
- **Admin panel** — Painel administrativo para gestão de conteúdo, usuários, pedidos e cupons
- **Migrar rate limiter para Redis** — Substituir store in-memory por Redis para produção multi-instância
- **Checkout transparente MercadoPago** — SDK JS para checkout sem redirecionamento
- **Ativação automática de produtos** — Integração com plugins do servidor Minecraft
- **Perfil público** — Rota `/perfil/[username]` com dados públicos do jogador

---

## [v0.11] — Histórico de compras funcional e detecção de VIP ativo

### Adicionado

- **API de Compras do Perfil** (`GET /api/perfil/compras`):
  - Listagem paginada de pedidos do usuário autenticado (20 por página)
  - Filtro por status via query param `status` (PENDING, APPROVED, REJECTED, REFUNDED)
  - Paginação via query param `page`
  - Cada pedido inclui: items com dados do produto, método de pagamento, cupom aplicado (código + %), data
  - Resumo agregado: total gasto (apenas pedidos aprovados), total de pedidos, contagem de aprovados
  - Detecção de VIP ativo: busca pedido APPROVED com produto categoria VIP e `durationDays` definido, calcula data de expiração e retorna se ainda válido
  - Protegido por autenticação

### Modificado

- **ComprasContent** (`src/components/perfil/ComprasContent.tsx`):
  - Removidos dados mock (`MOCK_ORDERS`) — agora consome `GET /api/perfil/compras`
  - Filtro por status agora usa valores reais da API (`APPROVED`, `PENDING`, `REJECTED`, `REFUNDED`) com re-fetch
  - Banner VIP condicional: exibido apenas quando API retorna VIP ativo com data de expiração real
  - Paginação funcional com botões "Anterior" / "Próxima" e indicador de página
  - Estado de loading com spinner `Loader2` durante fetches
  - Nomes de produtos concatenados quando pedido tem múltiplos itens (e.g., "VIP+ Mensal, Trail Fire")
  - Badge de cupom aplicado exibida no card do pedido (código + % off)
  - Ícone `Package` no card e botões de paginação com `ChevronLeft`/`ChevronRight`
  - Estado vazio melhorado com contexto do filtro ativo e CTA "Ir para a Loja"
  - Suporte a métodos de pagamento do MercadoPago (pix, credit_card, debit_card, bolbradesco)

### Decisões técnicas

- **Paginação server-side**: O filtro de status e a paginação são processados na API com `take`/`skip` do Prisma, evitando transferência de todos os pedidos ao frontend. Cada mudança de filtro ou página dispara um novo fetch.
- **VIP detection por data de criação + durationDays**: A expiração do VIP é calculada como `createdAt + durationDays` do pedido aprovado mais recente com produto VIP. Isso é uma heurística simples; um sistema de subscriptions dedicado poderá substituir essa lógica no futuro.
- **Resumo com aggregate**: O total gasto e contagem de pedidos aprovados usam `prisma.order.aggregate` separado do `findMany`, para que os totais reflitam todos os pedidos do usuário (não apenas a página atual).
- **Status mapping**: Os status da API (`APPROVED`, `PENDING`, `REJECTED`, `REFUNDED`) são mapeados para labels em português no frontend, mantendo a consistência com o enum `OrderStatus` do Prisma.

### Próximos passos (v0.12+)

- **Conteúdo de aulas** — Player de vídeo, exercícios interativos e tracking de progresso por disciplina
- **Notificações in-app** — Sistema de notificações para novos conteúdos, promoções, respostas no fórum e atualizações do servidor
- **Admin panel** — Painel administrativo para gestão de conteúdo, usuários, pedidos e cupons
- **Migrar rate limiter para Redis** — Substituir store in-memory por Redis para produção multi-instância
- **Checkout transparente MercadoPago** — SDK JS do MercadoPago para checkout sem redirecionamento (Checkout Pro)
- **Ativação automática de produtos** — Integração via API ou banco direto com plugins do servidor Minecraft para ativação de VIP/Ranks/itens
- **Envio de newsletters em massa** — Interface para enviar newsletters programadas aos inscritos confirmados
- **Perfil público** — Rota `/perfil/[username]` com dados públicos do jogador (stats, conquistas, atividade)

---

## [v0.10] — Integração MercadoPago, sistema de cupons e checkout completo

### Adicionado

- **Módulo MercadoPago** (`src/lib/mercadopago.ts`) — Cliente MercadoPago SDK v2:
  - Instância `Preference` para criação de preferências de pagamento
  - Instância `Payment` para consulta de status de pagamentos
  - Configuração `MP_CONFIG` com back URLs (sucesso/falha/pendente), notification URL e statement descriptor
  - Variável de ambiente `MERCADOPAGO_ACCESS_TOKEN` obrigatória

- **API de Validação de Cupons** (`POST /api/cupons/validar`):
  - Recebe `code` no body, busca cupom por código único
  - Verifica: existência, ativo, não expirado, limite de usos não atingido
  - Retorna `{ valid, code, discount, id }` se válido
  - Protegido por autenticação

- **API de Checkout** (`POST /api/loja/checkout`):
  - Rate limiting: 5 tentativas / 15 min por userId (`RATE_LIMITS.checkout`)
  - Valida carrinho não vazio, estoque disponível e produtos ativos
  - Calcula subtotal, aplica cupom (percentual) se fornecido
  - Cria `Order` + `OrderItem[]` + incrementa `uses` do cupom em transação Prisma
  - Cria preferência MercadoPago com itens, back URLs, webhook URL e external reference
  - Desconto aplicado proporcionalmente nos preços dos itens (MercadoPago não suporta itens negativos)
  - Em caso de erro MercadoPago: marca pedido como REJECTED e retorna erro
  - Retorna `{ orderId, preferenceId, initPoint, total, discount, subtotal }`

- **API de Webhook MercadoPago** (`POST /api/loja/webhook`):
  - Recebe notificações de pagamento do MercadoPago
  - Verificação de assinatura HMAC-SHA256 com `x-signature` header (se `MERCADOPAGO_WEBHOOK_SECRET` configurado)
  - Consulta pagamento via `payment.get()` e mapeia status: approved → APPROVED, rejected/cancelled → REJECTED, refunded/charged_back → REFUNDED
  - Na aprovação: limpa carrinho do usuário, decrementa estoque de produtos com limite
  - Envia email de confirmação de compra (fire-and-forget)
  - Idempotente: ignora se status já é igual ao novo

- **API de Pedido** (`GET /api/loja/pedido/[id]`):
  - Retorna detalhes do pedido com itens, produtos, cupom aplicado e totais
  - Verificação de ownership: apenas dono do pedido ou admin pode acessar
  - Protegido por autenticação

- **Email de Confirmação de Compra** (`sendOrderConfirmationEmail`) — Novo template em `src/lib/email.ts`:
  - Tabela com ID do pedido, método de pagamento (PIX/Cartão/Boleto/Débito) e total
  - Lista de itens comprados
  - Instruções de ativação (VIP/Rank → entrar no servidor, itens → entrega automática)
  - CTA "Ver Minhas Compras" → `/perfil/compras`

- **Página de Checkout** (`/loja/checkout`) — `CheckoutContent`:
  - Resumo dos itens do pedido (nome, quantidade, preço unitário, subtotal)
  - Campo de cupom com validação via API, indicador visual de cupom aplicado com % e botão remover
  - Seção "Formas de Pagamento" com cards PIX / Cartão / Boleto (informativo — escolha feita no MercadoPago)
  - Sidebar com subtotal, desconto, total e botão "PAGAR R$ X,XX" que redireciona para MercadoPago
  - Estado de processamento com spinner durante criação do pedido
  - Exibição de erros (carrinho vazio, estoque insuficiente, erro MercadoPago)
  - Protegida por autenticação no proxy; `robots: noindex, nofollow`

- **Páginas de Resultado do Pedido** (`/loja/pedido/sucesso|pendente|falha`):
  - `PedidoResultContent` com 3 estados visuais (sucesso verde, pendente amarelo, falha vermelho)
  - Ícone animado (Framer Motion spring), título, mensagem contextual
  - Fetch automático dos detalhes do pedido via `external_reference` da URL (retornado pelo MercadoPago)
  - Tabela de itens e total do pedido
  - Botões de ação: "Ver Minhas Compras" ou "Tentar Novamente" (falha) + "Voltar à Loja"
  - `Suspense` wrapper para `useSearchParams()`

- **Script de migração v0.10** (`scripts/migrate-v10.mjs`):
  - Verifica/adiciona colunas `payment_method` e `payment_id` na tabela orders (IF NOT EXISTS)
  - Seed de 3 cupons de exemplo (5%, 10% e 20% de desconto, dois deles com limite de usos)
  - Idempotente com `ON DUPLICATE KEY UPDATE`

### Modificado

- **CarrinhoContent** (`src/components/loja/CarrinhoContent.tsx`):
  - Cupom agora funcional: campo de código com validação via `POST /api/cupons/validar`
  - Estado de cupom aplicado com indicador visual (código + % off + botão remover)
  - Desconto calculado e exibido no resumo (subtotal, desconto, total)
  - Erros de cupom exibidos em vermelho abaixo do campo
  - Botão "FINALIZAR COMPRA" agora navega para `/loja/checkout` via `router.push()`
  - Adicionado `useRouter` do next/navigation

- **Rate Limiter** (`src/lib/rate-limit.ts`):
  - Adicionados presets `checkout` (5 tentativas / 15 min) e `coupon` (10 validações / 15 min)

- **Proxy (middleware)** (`src/proxy.ts`):
  - `/loja/checkout` e `/loja/pedido/*` adicionados ao array `protectedRoutes`
  - Rotas adicionadas ao `config.matcher`

- **`.env.example`** — Adicionada seção MercadoPago com `MERCADOPAGO_ACCESS_TOKEN` e `MERCADOPAGO_WEBHOOK_SECRET` (opcional)

### Dependências adicionadas

- `mercadopago` — SDK oficial MercadoPago v2 para Node.js (criação de preferências, consulta de pagamentos)

### Decisões técnicas

- **Redirect para MercadoPago (init_point)**: Em vez de checkout transparente com SDK JS, optou-se por redirecionamento para a página de pagamento do MercadoPago. Vantagens: PCI compliance automático, suporte completo a PIX/cartão/boleto sem código adicional, UX confiável para o usuário. A integração com Checkout Pro (transparente) pode ser feita em versão futura.
- **Desconto proporcional nos itens**: MercadoPago não aceita itens com preço negativo. O desconto do cupom é distribuído proporcionalmente entre os itens para que o total MP coincida com o total do pedido.
- **Webhook com verificação de assinatura**: A assinatura HMAC-SHA256 valida que a notificação veio do MercadoPago. O secret é opcional em dev mas recomendado em produção.
- **Estoque decrementado no webhook, não no checkout**: O estoque só é decrementado quando o pagamento é aprovado (webhook), não quando o pedido é criado. Isso evita reservas de estoque para pagamentos nunca concretizados.
- **Carrinho limpo na aprovação**: O carrinho é limpo automaticamente na aprovação do pagamento pelo webhook, garantindo que a limpeza ocorra mesmo se o usuário fechar a aba após o pagamento.
- **Order com status REJECTED em falha de MercadoPago**: Se a criação da preferência falhar, o pedido é marcado como REJECTED no banco. Isso mantém rastreabilidade sem deixar pedidos "fantasma" pendentes.
- **Token de acesso via variável de ambiente**: A credencial do MercadoPago é carregada exclusivamente de `MERCADOPAGO_ACCESS_TOKEN` e não é logada nem exposta em responses.

### Próximos passos (v0.11+)

- **Conteúdo de aulas** — Player de vídeo, exercícios interativos e tracking de progresso por disciplina
- **Notificações in-app** — Sistema de notificações para novos conteúdos, promoções, respostas no fórum e atualizações do servidor
- **Admin panel** — Painel administrativo para gestão de conteúdo, usuários, pedidos e cupons
- **Migrar rate limiter para Redis** — Substituir store in-memory por Redis para produção multi-instância
- **Checkout transparente MercadoPago** — SDK JS do MercadoPago para checkout sem redirecionamento (Checkout Pro)
- **Ativação automática de produtos** — Integração via API ou banco direto com plugins do servidor Minecraft para ativação de VIP/Ranks/itens
- **Envio de newsletters em massa** — Interface para enviar newsletters programadas aos inscritos confirmados
- **Histórico de compras funcional** — `GET /api/perfil/compras` conectando ComprasContent a dados reais do banco

---

## [v0.9] — Rotas dinâmicas de aulas e persistência do carrinho

### Adicionado

- **Modelo Discipline** (`website_disciplines`) — Disciplinas do servidor educacional:
  - Campos: id, name, slug (unique), description, shortDescription, icon, color, banner, levels (JSON), order, active, createdAt, updatedAt
  - Relação `lessons Lesson[]` com modelo Lesson

- **Modelo Lesson** (`website_lessons`) — Aulas dentro de cada disciplina:
  - Campos: id, disciplineId (FK → Discipline), title, slug (unique), description, order, duration, active, createdAt, updatedAt
  - Índice composto `@@unique([disciplineId, slug])`

- **Modelo CartItem** (`website_cart_items`) — Persistência de carrinho de compras:
  - Campos: id, userId (FK → User), productId (FK → Product), quantity, createdAt, updatedAt
  - Constraint `@@unique([userId, productId])` para evitar duplicatas
  - Relações com User e Product

- **API de Aulas — Listagem** (`GET /api/aulas`):
  - Query params: `busca` (search em nome/descrição), `nivel` (filtro por nível no campo JSON levels)
  - Retorna disciplinas ativas com contagem de aulas (`_count.lessons`)
  - Parse automático do campo `levels` de JSON string para array

- **API de Aulas — Detalhe** (`GET /api/aulas/[slug]`):
  - Busca disciplina por slug + active:true
  - Inclui aulas ativas ordenadas por `order`
  - Retorna 404 se disciplina não encontrada ou inativa

- **API de Carrinho — Listagem e Adição** (`/api/carrinho`):
  - `GET` — Lista itens do carrinho com detalhes do produto, subtotal e contagem; filtra produtos inativos
  - `POST` — Adiciona item ao carrinho com validação de productId, verificação de estoque e upsert (incrementa quantidade se já existente)
  - Ambos endpoints protegidos por autenticação

- **API de Carrinho — Item** (`/api/carrinho/[id]`):
  - `PUT` — Atualiza quantidade (validação 1-99) com verificação de ownership (userId)
  - `DELETE` — Remove item do carrinho com verificação de ownership
  - Ambos endpoints protegidos por autenticação

- **Página dinâmica de disciplina** (`/aulas/[slug]`):
  - Server component com `generateMetadata` para SEO dinâmico
  - `await params` (Next.js 16 Promise params)

- **DisciplinaContent** (`src/components/aulas/DisciplinaContent.tsx`):
  - Fetch da API `/api/aulas/{slug}`, mapeamento dinâmico de ícones (ICON_MAP)
  - Sidebar com stats (total de aulas, duração, níveis), lista curricular com numeração e duração
  - CTA auth-aware: logado → cronograma, não logado → registro
  - Loading/error states com Framer Motion

- **CarrinhoContent** (`src/components/loja/CarrinhoContent.tsx`):
  - Página dedicada de carrinho com fetch da API `/api/carrinho`
  - Controles de quantidade (±), remoção de itens, animações com AnimatePresence
  - Resumo do pedido: subtotal, desconto, total, campo de cupom
  - Checkbox de aceite dos Termos e botão "FINALIZAR COMPRA"
  - Estados: loading, carrinho vazio, não autenticado (com redirect para login)

- **Página /loja/carrinho** (`src/app/loja/carrinho/page.tsx`):
  - Metadata com `robots: { index: false, follow: false }` (rota protegida)
  - Rota já configurada em `protectedRoutes` no proxy.ts

- **Script de migração v0.9** (`scripts/migrate-v09.mjs`):
  - CREATE TABLE website_disciplines, website_lessons, website_cart_items
  - ALTER TABLE products: 10 novos campos (short_description, original_price, duration_days, benefits, server_command, stock, featured, badge, color, `order`)
  - Idempotente com IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

- **Script de seed de aulas** (`scripts/seed-aulas.mjs`):
  - 8 disciplinas (Matemática, Ciências, Português, História, Geografia, Inglês, Redação, Programação)
  - 26 aulas distribuídas entre as disciplinas
  - IDs determinísticos (e.g., `disc_matematica`, `les_mat_01`), idempotente com ON DUPLICATE KEY UPDATE

### Modificado

- **Schema Prisma** (`prisma/schema.prisma`):
  - Modelo Product: novos campos `shortDescription`, `originalPrice`, `durationDays`, `benefits`, `serverCommand`, `stock` (default -1), `featured`, `badge`, `color`, `order` e relação `cartItems`
  - Modelo User: adicionada relação `cartItems CartItem[]`
  - 3 novos modelos: Discipline, Lesson, CartItem

- **AulasContent** (`src/components/aulas/AulasContent.tsx`):
  - Removido array estático DISCIPLINES com dados mock
  - Fetch dinâmico da API `/api/aulas` com debounce de 300ms na busca
  - Cards de disciplina agora são `<Link>` para `/aulas/{slug}`
  - Mostram `lessonsCount` vindo da API em vez de valor estático
  - Estado de loading com spinner Loader2

- **LojaContent** (`src/components/loja/LojaContent.tsx`):
  - Carrinho agora usa API persistente (`POST /api/carrinho`) para usuários autenticados
  - Não autenticados são redirecionados para `/login?redirect=/loja` ao clicar "Adicionar"
  - Fetch de resumo do carrinho (contagem + total) da API no mount
  - Botão "Adicionar" com estado de loading (spinner)
  - Floating cart bar agora é `<Link>` para `/loja/carrinho` (removido modal de carrinho inline)

### Decisões técnicas

- **Prefixo `website_` para novas tabelas**: Convenção definida na documentação aplicada a todas as novas tabelas (website_disciplines, website_lessons, website_cart_items). Tabelas existentes mantêm nomes originais — migração de nomenclatura planejada como tech debt futuro.
- **IDs determinísticos nos seeds**: Seeds usam IDs curtos e descritivos (e.g., `disc_matematica`) em vez de UUIDs para facilitar referência em desenvolvimento e testes.
- **Upsert no carrinho**: `POST /api/carrinho` faz upsert — se o item já existe no carrinho, incrementa a quantidade em vez de criar duplicata. Constraint `@@unique([userId, productId])` garante integridade.
- **Stock -1 como "ilimitado"**: Produtos com `stock = -1` não têm limite de estoque. Qualquer valor ≥ 0 representa limite real verificado na adição ao carrinho.
- **Levels como JSON string**: O campo `levels` da Discipline armazena um JSON array stringificado para flexibilidade (e.g., `["fundamental", "medio"]`). Parse é feito na API antes de retornar ao cliente.
- **API-first para aulas**: AulasContent consome dados via fetch em vez de import direto do Prisma, mantendo separação client/server e permitindo cache HTTP futuro.

### Próximos passos (v1.0+)

- **Integração MercadoPago** — Checkout com API de pagamentos para planos VIP/Premium e itens da loja
- **Sistema de cupons** — Modelo de cupons com validação, desconto percentual/fixo e data de expiração
- **Conteúdo de aulas** — Player de vídeo, exercícios interativos e tracking de progresso por disciplina
- **Notificações** — Sistema de notificações in-app para novos conteúdos, promoções e atualizações do servidor

---

## [v0.8] — 27/03/2026 — Sistema de email, recuperação de senha e newsletter

### Adicionado

- **Módulo de email** (`src/lib/email.ts`) — Nodemailer v7 com templates HTML responsivos branded CraftSapiens:
  - `sendPasswordResetEmail()` — Email de recuperação de senha com link de redefinição (expira em 1h)
  - `sendNewsletterConfirmationEmail()` — Email de double opt-in para newsletter
  - `sendWelcomeEmail()` — Email de boas-vindas com instruções de acesso ao servidor Minecraft
  - `sendContactConfirmationEmail()` — Confirmação de recebimento de mensagem do formulário de contato
  - `baseTemplate()` — Layout HTML com header verde, branding CraftSapiens e footer com copyright
  - `escapeHtml()` — Sanitização XSS para conteúdo dinâmico nos templates
  - Configuração via variáveis de ambiente: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

- **API de Recuperação de Senha** (`src/app/api/auth/recuperar-senha/route.ts`) — `POST /api/auth/recuperar-senha`:
  - Rate limiting: 3 tentativas por hora por IP (`RATE_LIMITS.passwordReset`)
  - Resposta genérica anti-enumeração ("Se o email estiver cadastrado…") independente do resultado
  - Invalida tokens anteriores não usados do mesmo usuário
  - Gera token de 64 chars hex (32 bytes via `crypto.randomBytes`), armazena hash SHA-256 no banco
  - Envia email com link de redefinição válido por 1 hora
  - Busca por email no modelo User com relação nLogin

- **API de Redefinição de Senha** (`src/app/api/auth/redefinir-senha/route.ts`) — `POST /api/auth/redefinir-senha`:
  - Valida token via hash SHA-256 (token nunca armazenado em texto plano)
  - Verifica expiração (1h) e uso prévio do token
  - Validação de senha: mínimo 8 chars, pelo menos 1 letra e 1 número, confirmação de senha
  - Atualiza hash no nLogin via `hashPassword()` + marca token como usado em transação Prisma `$transaction`

- **API de Newsletter — Inscrição** (`src/app/api/newsletter/route.ts`) — `POST /api/newsletter`:
  - Rate limiting: 3 tentativas por hora por IP (`RATE_LIMITS.newsletter`)
  - Double opt-in: gera token de confirmação e envia email
  - Handles re-inscrição: se email existente cancelou ou não confirmou, regenera token e reenvia confirmação
  - Resposta amigável se email já confirmado ("já está inscrito")
  - Validação de formato de email com regex

- **API de Newsletter — Confirmação** (`src/app/api/newsletter/confirmar/route.ts`) — `GET /api/newsletter/confirmar?token=xxx`:
  - Busca por `confirmToken` no modelo Newsletter
  - Seta `confirmed: true, unsubscribedAt: null`, mantém token para uso futuro (cancelamento)
  - Retorno idempotente se já confirmado

- **API de Newsletter — Cancelamento** (`src/app/api/newsletter/cancelar/route.ts`) — `GET /api/newsletter/cancelar?token=xxx`:
  - Busca por `confirmToken`, seta `confirmed: false, unsubscribedAt: new Date()`
  - Limpa o token para prevenir reutilização
  - Soft-delete: registro mantido para auditoria

- **Página Recuperar Senha** (`src/app/recuperar-senha/page.tsx` + `src/components/auth/RecuperarSenhaContent.tsx`):
  - Formulário de email com validação
  - Estado de sucesso com feedback visual (ícone CheckCircle, mensagem informativa, dica sobre spam)
  - Link de volta para login; Framer Motion para animações
  - SEO: metadata com título e descrição

- **Página Redefinir Senha** (`src/app/redefinir-senha/page.tsx` + `src/components/auth/RedefinirSenhaContent.tsx`):
  - Lê token da URL via `useSearchParams()` (envolto em `Suspense`)
  - Indicador de força de senha em 5 níveis (Muito fraca → Muito forte) com barra colorida
  - Toggles mostrar/ocultar senha para ambos os campos
  - Estados: erro de token ausente, sucesso com auto-redirect para login em 3s, token inválido
  - SEO: `robots: { index: false, follow: false }` (rota privada)

- **Página Confirmar Newsletter** (`src/app/newsletter/confirmar/page.tsx` + `src/components/newsletter/NewsletterConfirmarContent.tsx`):
  - Confirmação automática ao montar via `useEffect` + fetch para API
  - Estados de loading, sucesso (com ícone e link para home) e erro
  - `Suspense` wrapper para `useSearchParams()`

- **Script de migração** (`scripts/migrate-v08.mjs`):
  - `CREATE TABLE IF NOT EXISTS password_reset_tokens` — id, user_id (FK → users), token_hash (UNIQUE), expires_at, used_at, created_at
  - `ALTER TABLE newsletter ADD COLUMN IF NOT EXISTS unsubscribed_at`
  - `ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date, deactivated_at`
  - Idempotente (IF NOT EXISTS), usa driver `mariadb` nativo

### Modificado

- **Schema Prisma** (`prisma/schema.prisma`):
  - Novo modelo `PasswordResetToken` mapeado para `password_reset_tokens` com campos id, userId (FK → User), tokenHash (unique), expiresAt, usedAt, createdAt
  - Relação `passwordResetTokens PasswordResetToken[]` adicionada ao modelo User
  - Campo `unsubscribedAt DateTime?` adicionado ao modelo Newsletter

- **Footer** (`src/components/layout/Footer.tsx`):
  - Formulário de newsletter agora funcional: conectado a `POST /api/newsletter`
  - Estados de loading (spinner), sucesso (mensagem verde) e erro (mensagem vermelha)
  - Import do ícone `Loader2` do lucide-react

- **Rate Limiter** (`src/lib/rate-limit.ts`):
  - Adicionados presets `passwordReset` (3 tentativas / 1 hora) e `newsletter` (3 tentativas / 1 hora)

- **Proxy (middleware)** (`src/proxy.ts`):
  - `/recuperar-senha` e `/redefinir-senha` adicionados ao array `authRoutes` (redireciona para /perfil se logado)
  - Ambas as rotas adicionadas ao `config.matcher`

- **API de Registro** (`src/app/api/auth/register/route.ts`):
  - Envio de email de boas-vindas fire-and-forget após registro bem-sucedido via `sendWelcomeEmail()`

- **API de Contato** (`src/app/api/contato/route.ts`):
  - Envio de email de confirmação fire-and-forget após salvar mensagem via `sendContactConfirmationEmail()`

- **`.env.example`** — Adicionada seção SMTP com as 6 variáveis de configuração do Nodemailer

### Decisões técnicas

- **Token hashing com SHA-256**: O token de recuperação é enviado ao usuário como URL param, mas no banco é armazenado apenas o hash SHA-256. Mesmo com acesso ao banco, não é possível reconstruir o token original.
- **Resposta genérica anti-enumeração**: `POST /api/auth/recuperar-senha` retorna sempre a mesma mensagem independente do email existir ou não, prevenindo user enumeration attacks.
- **Double opt-in newsletter**: Inscrição requer confirmação por email para compliance com boas práticas de email marketing e prevenção de spam/abuse com emails de terceiros.
- **Fire-and-forget para emails não-críticos**: Emails de boas-vindas e confirmação de contato são disparados sem `await`, para não atrasar a response ao usuário. Erros são logados mas não propagados.
- **Nodemailer v7 (não v8)**: v8 tem peer dependency conflict com next-auth@5.0.0-beta.30 (exige nodemailer v6). v7.0.7 é compatível com ambos.
- **Token de confirmação mantido após ativação**: O `confirmToken` da newsletter é preservado após confirmação para permitir uso no link de cancelamento (unsubscribe).
- **Script de migração com mariadb nativo**: Mesmo padrão das versões anteriores — driver direto, sem dependência do Prisma Client, idempotente com IF NOT EXISTS.

### Próximos passos (v0.9+)

- **Integração MercadoPago** — API de pagamentos para planos VIP/Premium e produtos da loja
- **Rotas dinâmicas de aulas** — `/aulas/[slug]` com conteúdo da aula, vídeo e exercícios
- **Persistência do carrinho** — Carrinho de compras salvo no banco (atualmente inexistente)
- **Página /loja/carrinho** — Página dedicada para o carrinho de compras
- **Migrar rate limiter para Redis** — Substituir store in-memory por Redis para produção multi-instância
- **Sistema de reports/denúncias** — UI para reportar posts/comentários + painel de moderação
- **Notificações** — Notificar autores sobre respostas aos seus tópicos/comentários
- **Admin panel** — Painel administrativo para gestão de conteúdo, usuários e pedidos
- **Envio de newsletters em massa** — Interface para enviar newsletters programadas aos inscritos confirmados

---

## [v0.7.1] — 26/03/2026 — Correções de deploy do fórum

### Corrigido

- **Schema no banco de dados** — Colunas adicionadas no v0.7 não existiam no banco remoto (`staff_only`, `active` em `forum_categories`; `slug`, `resolved`, `tags`, `last_activity_at` em `posts`). Aplicadas via ALTER TABLE direto pois `prisma db push` falhava com índice corrompido (`plan_ping`) em tabela externa no banco compartilhado.
- **Script seed-forum.mjs** — Corrigido import ESM (`import mariadb from "mariadb"` → `import * as mariadb from "mariadb"`) compatível com Node.js 20 + .mjs.
- **IDs do seed** — Substituído `UUID()` (36 chars, incompatível com CUID VARCHAR(25)) por IDs determinísticos curtos (`fcat_slug`), seguindo o padrão do seed-blog.mjs.

### Decisões técnicas

- **ALTER TABLE manual**: `prisma db push` falha quando o banco compartilhado tem índices corrompidos em tabelas fora do schema. Workaround: aplicar ALTER TABLE via driver mariadb direto, com `ADD COLUMN IF NOT EXISTS` para idempotência e backfill de slugs para posts existentes.
- **Import ESM do mariadb**: O pacote `mariadb` não exporta default em ESM. Usar `import * as mariadb` em vez de `import mariadb from`.

---

## [v0.7] — 27/03/2026 — CRUD do fórum e comunidade dinâmica

### Adicionado

- **API de Categorias do Fórum** (`src/app/api/forum/categorias/route.ts`) — `GET /api/forum/categorias`:
  - Retorna todas as categorias ativas com contagem de tópicos, total de membros e último post
  - Query otimizada com `_count`, `include` de último post e autor
  - Filtra por `active: true` e ordena por `order`

- **API de Tópicos — Listagem e Criação** (`src/app/api/forum/topicos/route.ts`):
  - `GET /api/forum/topicos` — Listagem paginada com filtro por categoria (`categoria` slug), busca textual (`busca`), ordenação por fixados + última atividade
  - `POST /api/forum/topicos` — Criação de tópico com:
    - Autenticação obrigatória via `auth()`
    - Rate limiting (5 tópicos/hora via `RATE_LIMITS.forumTopic`)
    - Anti-spam: conta precisa ter >1h de idade
    - Restrição de categorias `staffOnly` para ADMIN/MODERADOR
    - Detecção de duplicatas (mesmo título na mesma categoria em 24h)
    - Geração automática de slug com tratamento de colisão (sufixo numérico)
    - Validação: título 5-100 chars, conteúdo 10-10000 chars

- **API de Tópico Individual** (`src/app/api/forum/topicos/[slug]/route.ts`):
  - `GET /api/forum/topicos/[slug]` — Detalhe do tópico com incremento de views, dados do autor com reputação calculada (posts + comentários + curtidas×2 - descurtidas), contagem de posts/comentários do autor
  - `PUT /api/forum/topicos/[slug]` — Edição com janela de 30min para autores, staff sem restrição; suporta fixar, trancar e resolver (staff only)
  - `DELETE /api/forum/topicos/[slug]` — Autor pode deletar se não há comentários, staff pode deletar sempre

- **API de Comentários** (`src/app/api/forum/comentarios/route.ts`):
  - `GET /api/forum/comentarios` — Listagem paginada por tópico com respostas aninhadas (1 nível), dados do autor com role e UUID
  - `POST /api/forum/comentarios` — Criação com autenticação, rate limiting (10/15min), verificação de tópico trancado, enforcement de 1 nível de aninhamento, atualiza `lastActivityAt` do post pai

- **API de Comentário Individual** (`src/app/api/forum/comentarios/[id]/route.ts`):
  - `PUT` — Edição com janela de 30min para autor
  - `DELETE` — Autor pode deletar se não há respostas, staff pode deletar sempre

- **API de Reações** (`src/app/api/forum/reacoes/route.ts`) — `POST /api/forum/reacoes`:
  - Toggle de like/dislike em posts ou comentários
  - Estados: criar reação, remover se já existe igual, ou trocar se tipo diferente
  - Autenticação obrigatória

- **Componente ComunidadeContent** reescrito (`src/components/comunidade/ComunidadeContent.tsx`):
  - Removidos todos os dados mock (CATEGORIES, MOCK_TOPICS, STATS)
  - Busca dinâmica de categorias via `GET /api/forum/categorias`
  - Cards de categoria com ícone, contagem de tópicos/posts, último tópico e autor
  - Barra de estatísticas em tempo real (membros, total de tópicos)
  - Links para rotas dinâmicas `/comunidade/[slug]`

- **Componente CategoriaContent** (`src/components/comunidade/CategoriaContent.tsx`):
  - Listagem de tópicos de uma categoria com busca, paginação e estados de loading/vazio
  - Modal de criação de tópico com validação (título 5-100, conteúdo 10-10000 chars)
  - Avatares via mc-heads.net (UUID), badges de role (Admin/Moderador/Professor)
  - Ícones de fixado, trancado e resolvido; contagem de respostas e views

- **Componente TopicoContent** (`src/components/comunidade/TopicoContent.tsx`):
  - Visualizador completo de tópico com sidebar do autor (avatar, role, badge de reputação, stats)
  - Sistema de reputação visual com quatro níveis: Novato, Membro, Veterano e Lenda
  - Renderizador de conteúdo com bold, italic, code inline e sanitização XSS
  - Seção de comentários com respostas aninhadas (1 nível), paginação, reações (like/dislike)
  - Formulário de resposta com suporte a reply direto a comentário
  - Estados: tópico trancado, não autenticado, compartilhar link, reportar
  - Framer Motion para animações de entrada

- **Rotas dinâmicas do fórum**:
  - `/comunidade/[categoria]/page.tsx` — Página de categoria passando slug para CategoriaContent
  - `/comunidade/[categoria]/[topico]/page.tsx` — Página de tópico passando slugs para TopicoContent

- **Script de seed do fórum** (`scripts/seed-forum.mjs`):
  - Popula banco com 7 categorias: Anúncios, Geral, Dúvidas de Aulas, Sugestões, Bugs & Problemas, Showroom, Off-Topic
  - Ícones emoji, descrições, flags staffOnly e slugs únicos
  - Uso: `node scripts/seed-forum.mjs` (requer `DATABASE_URL` no `.env`)
  - Idempotente com `ON DUPLICATE KEY UPDATE`

### Modificado

- **Schema Prisma** (`prisma/schema.prisma`):
  - `ForumCategory`: adicionados campos `staffOnly Boolean @default(false)` e `active Boolean @default(true)`
  - `Post`: adicionados campos `slug String @unique`, `resolved Boolean @default(false)`, `tags String? @db.Text`, `lastActivityAt DateTime @default(now())`

- **Rate Limiter** (`src/lib/rate-limit.ts`):
  - Adicionados presets `forumTopic` (5 tentativas / 1 hora) e `forumComment` (10 tentativas / 15 minutos)

### Decisões técnicas

- **API-first com Client Components**: Mesma abordagem do blog — fetch dinâmico em componentes client para permitir interatividade (busca, paginação, modais) sem full page reload.
- **Slug com colisão handling**: Geração automática de slug via `slugify()` com checagem de unicidade e sufixo numérico incremental para evitar conflitos.
- **Reputação calculada on-the-fly**: Score = posts + comentários + (curtidas em posts × 2) + curtidas em comentários - descurtidas. Calculado no GET do tópico, sem campo persistido, para simplicidade e consistência.
- **Aninhamento de 1 nível**: Comentários permitem apenas 1 nível de resposta (reply a reply é bloqueado). Evita threads infinitamente aninhadas e simplifica a UI.
- **Edit window de 30 minutos**: Autores podem editar posts/comentários apenas nos primeiros 30min. Staff (Admin/Moderador) não tem restrição. Previne alteração de contexto em discussões longas.
- **Anti-spam multi-camada**: Rate limiting + idade mínima da conta (1h) + detecção de duplicatas (24h) para criação de tópicos.
- **Seed com mariadb nativo**: Mesmo padrão do seed-blog — driver `mariadb` direto, sem dependência de Prisma Client, idempotente.

### Próximos passos (v0.8+)

- **Recuperação de senha por email** — Fluxo esqueci-senha com token temporário e envio de email (requer configuração SMTP)
- **Envio de emails** — Módulo Nodemailer ou Resend para emails transacionais (confirmação, recuperação, newsletter)
- **Integração MercadoPago** — API de pagamentos para planos VIP/Premium e produtos da loja
- **Rotas dinâmicas de aulas** — `/aulas/[slug]` com conteúdo da aula, vídeo e exercícios
- **Persistência do carrinho** — Carrinho de compras salvo no banco (atualmente inexistente)
- **Newsletter double opt-in** — Confirmação de email antes de ativar inscrição
- **Migrar rate limiter para Redis** — Substituir store in-memory por Redis para produção multi-instância
- **Página /loja/carrinho** — Página dedicada para o carrinho de compras
- **Sistema de reports/denúncias** — UI para reportar posts/comentários + painel de moderação
- **Notificações** — Notificar autores sobre respostas aos seus tópicos/comentários

---

## [v0.6] — 26/03/2026 — Blog dinâmico, gerenciamento de conta e .env.example

### Adicionado

- **`.env.example`** — Arquivo de referência documentando todas as variáveis de ambiente necessárias:
  - `DATABASE_URL` (obrigatória), `AUTH_SECRET`, `AUTH_URL`, `MINECRAFT_SERVER_HOST`, `MINECRAFT_SERVER_PORT`
  - Evita exposição acidental de credenciais e facilita onboarding de novos devs

- **API do Blog — Listagem** (`src/app/api/blog/route.ts`) — `GET /api/blog`:
  - Paginação com `page` e `limit` (padrão 9 por página)
  - Filtragem por categoria via parâmetro `categoria` (slug)
  - Busca textual via parâmetro `busca` (pesquisa em `title` e `excerpt`)
  - Inclui dados do autor (username via nlogin, uuid para avatar Minecraft)
  - Retorna `{ posts, pagination: { page, limit, total, totalPages } }`

- **API do Blog — Post individual** (`src/app/api/blog/[slug]/route.ts`) — `GET /api/blog/[slug]`:
  - Busca post por slug com dados completos (content, author, category)
  - Incremento automático de visualizações (fire-and-forget)
  - Posts relacionados: até 3 posts da mesma categoria
  - Navegação: retorna `prev` e `next` posts por data de publicação
  - Retorna `{ post, related, navigation: { prev, next } }`

- **Página dinâmica do blog** (`src/app/blog/[slug]/page.tsx`):
  - Rota dinâmica com `generateMetadata` para SEO (título dinâmico)
  - Renderiza o componente `BlogPostContent` com o slug como prop

- **Componente BlogPostContent** (`src/components/blog/BlogPostContent.tsx`):
  - Visualizador completo de post com estados de loading, erro e post não encontrado
  - Imagem de capa, badge de categoria, contador de views, tempo de leitura
  - Avatar do autor via Crafatar (UUID do Minecraft)
  - Renderizador de Markdown customizado (`renderMarkdown()`) com suporte a: headings, bold/italic, code, blockquotes, listas, links, linhas horizontais
  - Sanitização HTML contra XSS (escape de `<`, `>`, `&`, `"`, `'`)
  - Tags do post, botão de copiar link, navegação prev/next, grid de posts relacionados
  - Framer Motion para animações de entrada

- **API de Desativação de Conta** (`src/app/api/perfil/desativar/route.ts`) — `POST /api/perfil/desativar`:
  - Define `deactivatedAt = new Date()` no registro do usuário
  - Protegido por `auth()` — retorna 401 se não autenticado
  - Permite reativação futura (soft delete)

- **API de Exclusão de Conta** (`src/app/api/perfil/conta/route.ts`) — `DELETE /api/perfil/conta`:
  - Requer `confirmation` (username + " CONFIRMAR") e `password` atual
  - Verificação de senha via `nloginVerifyPassword()` (multi-algoritmo)
  - Exclui Profile + User em transação Prisma (preserva dados nLogin/Minecraft)
  - Protegido por `auth()` — retorna 401 se não autenticado

- **Script de seed do blog** (`scripts/seed-blog.mjs`):
  - Popular banco com 6 categorias (novidades, aulas, eventos, midia, tutoriais, comunidade)
  - 9 posts iniciais com conteúdo Markdown realista
  - Uso: `node scripts/seed-blog.mjs` (requer `DATABASE_URL` no `.env`)
  - Idempotente: usa `ON DUPLICATE KEY UPDATE`

### Modificado

- **Schema Prisma** (`prisma/schema.prisma`) — Campos adicionados ao modelo `BlogPost`:
  - `authorId String?` — FK opcional para User (relação com autor)
  - `tags String? @db.Text` — Tags do post em formato JSON
  - `views Int @default(0)` — Contador de visualizações
  - `readTime Int @default(5)` — Tempo estimado de leitura em minutos
  - Relação `blogPosts BlogPost[]` adicionada ao modelo `User`

- **BlogContent** (`src/components/blog/BlogContent.tsx`) — Reescrito completamente:
  - Removidos todos os dados mock hardcoded (arrays de posts e categorias)
  - Busca dinâmica via `fetch('/api/blog')` com `useCallback` + `useEffect`
  - Paginação funcional com parâmetros de query
  - Filtro por categoria via API
  - Busca textual via parâmetro `busca`
  - Estados de loading com spinner animado
  - Mapa de cores de categorias (`CATEGORY_COLORS`) extraído como constante

- **ConfiguracoesContent** (`src/components/perfil/ConfiguracoesContent.tsx`) — Zona de Perigo funcional:
  - Adicionado import de `signOut` do next-auth/react
  - Botão "Desativar Conta" agora chama `POST /api/perfil/desativar` e faz `signOut()`
  - Seção "Excluir Conta" com campo de senha e confirmação textual (username + " CONFIRMAR")
  - Chama `DELETE /api/perfil/conta` com verificação de senha
  - Estados de loading, erro e sucesso para ambas as ações

### Decisões técnicas

- **Blog com API-first**: Em vez de SSR/SSG estático, optou-se por Client Components com fetch para permitir filtragem dinâmica e busca sem full page reload. Quando o volume de posts crescer, pode-se adicionar ISR.
- **Markdown renderer manual**: Implementação leve sem dependência de libs externas (remark/rehype). Suficiente para o conteúdo atual do blog. Pode ser substituído por libs dedicadas se necessário.
- **Seed script com mariadb nativo**: Usa driver `mariadb` diretamente em vez de Prisma Client para evitar dependência de `prisma generate` no script de seed. Idempotente com `ON DUPLICATE KEY UPDATE`.
- **Soft delete para desativação**: Conta desativada mantém dados intactos (campo `deactivatedAt`), permitindo reativação futura. Exclusão é hard delete de Profile + User mas preserva nLogin.
- **Confirmação dupla para exclusão**: Requer tanto senha quanto texto de confirmação (username + " CONFIRMAR") para prevenir exclusões acidentais.

### Próximos passos (v0.7+)

- **Recuperação de senha por email** — Fluxo esqueci-senha com token temporário e envio de email (requer configuração SMTP)
- **Envio de emails** — Módulo Nodemailer ou Resend para emails transacionais (confirmação, recuperação, newsletter)
- **Integração MercadoPago** — API de pagamentos para planos VIP/Premium e produtos da loja
- **CRUD do fórum** — APIs + páginas para criar/editar/deletar tópicos e comentários na comunidade
- **Rotas dinâmicas de aulas** — `/aulas/[slug]` com conteúdo da aula, vídeo e exercícios
- **Persistência do carrinho** — Carrinho de compras salvo no banco (atualmente inexistente)
- **Newsletter double opt-in** — Confirmação de email antes de ativar inscrição
- **Migrar rate limiter para Redis** — Substituir store in-memory por Redis para produção multi-instância
- **Página /loja/carrinho** — Página dedicada para o carrinho de compras
- **Admin panel** — Painel administrativo para gestão de conteúdo, usuários e pedidos

---

## [v0.5] — 26/03/2026 — Perfil dinâmico, APIs de gerenciamento e rate limiting

### Adicionado

- **Rate limiter in-memory** (`src/lib/rate-limit.ts`) — Módulo de rate limiting por chave (IP/username):
  - `checkRateLimit(key, config)` retorna `{ success, remaining, resetAt }`
  - Store Map-based com limpeza automática a cada 5 minutos
  - Presets pré-configurados: `login` (5/15min), `contact` (3/1h), `register` (3/1h), `passwordChange` (5/15min)
  - Conforme requisitos de RN-AUTH-02 (docs/paginas/07-auth.md) e RN-CONTATO-05 (docs/paginas/08-contato.md)

- **API de Perfil** (`src/app/api/perfil/route.ts`) — `GET + PUT /api/perfil`:
  - **GET**: Retorna dados completos do usuário autenticado — email, role, birthDate, nlogin (uuid, lastSeen, creationDate), profile (bio, avatar, coins, xp, playtime, aulas concluídas, ranking, preferências de privacidade e notificação), stats (_count de orders, posts, comments)
  - **PUT**: Atualização de email (com validação de unicidade e formato) e bio (máx. 500 chars)
  - Ambos protegidos por `auth()` — retorna 401 se não autenticado

- **API de Troca de Senha** (`src/app/api/perfil/senha/route.ts`) — `POST /api/perfil/senha`:
  - Verificação da senha atual via `nloginVerifyPassword()` (multi-algoritmo)
  - Validação da nova senha: mínimo 8 chars, ao menos 1 letra e 1 número
  - Hash da nova senha via `nloginHashPassword()` e atualização na tabela nLogin (sincronizado com servidor Minecraft)
  - Rate limiting: 5 tentativas por 15 minutos por userId

- **API de Configurações** (`src/app/api/perfil/configuracoes/route.ts`) — `PUT /api/perfil/configuracoes`:
  - Atualização de notificações: `notifForumRespostas`, `notifLembretesAulas`, `notifNovidades`, `notifResumoSemanal` (valores: "email", "push", "ambos", "off")
  - Atualização de privacidade: `perfilPublico`, `mostrarTempoOnline`, `mostrarAtividade` (boolean)
  - Validação whitelist dos valores aceitos

### Modificado

- **Schema Prisma** (`prisma/schema.prisma`) — Expansão dos models User e Profile:
  - **User**: Adicionados `birthDate` (DateTime?) e `deactivatedAt` (DateTime?) para data de nascimento e desativação de conta
  - **Profile**: Adicionados `playtimeMinutes` (Int?), `aulasConcluidas` (Int?), `rankingPosition` (Int?) para estatísticas de jogo; `perfilPublico` (Boolean? default true), `mostrarTempoOnline` (Boolean? default true), `mostrarAtividade` (Boolean? default true) para privacidade; `notifForumRespostas` (String? default "email"), `notifLembretesAulas` (String? default "email"), `notifNovidades` (String? default "email"), `notifResumoSemanal` (String? default "off") para notificações

- **`src/components/perfil/PerfilContent.tsx`** — Reescrito com dados reais:
  - `useSession()` + `fetch("/api/perfil")` substituem todos os dados mock
  - Avatar dinâmico via mc-heads.net usando UUID do nLogin
  - Estatísticas (coins, XP, playtime, ranking) calculadas da resposta da API
  - Badge de reputação calculado pela contagem de posts + comments
  - Loading spinner durante carregamento
  - Seções de progresso e atividade marcadas com comentários para implementação futura

- **`src/components/perfil/ConfiguracoesContent.tsx`** — Reescrito com APIs reais:
  - Fetch de dados do perfil no mount para preencher formulários
  - **Tab Dados**: `PUT /api/perfil` para atualizar email e bio
  - **Tab Senha**: `POST /api/perfil/senha` com verificação de senha atual e confirmação da nova
  - **Tab Notificações**: `PUT /api/perfil/configuracoes` com seletores para cada tipo de notificação
  - **Tab Privacidade**: Toggles de perfil público, tempo online e atividade via mesma API
  - **Tab Perigo**: Nome do usuário dinâmico da sessão, botões de desativar/excluir conta (estrutura preparada)
  - Indicadores de loading, erro e sucesso em cada formulário

- **`src/components/perfil/ComprasContent.tsx`** — Atualizado com sessão:
  - `useSession()` para detecção de autenticação
  - Estado `orders` gerenciado via `useState` (preparado para futura API)

- **`src/lib/nlogin.ts`** — `createUserWithProfile()` agora aceita parâmetro opcional `birthDate?: Date` para salvar data de nascimento no registro

- **`src/app/api/auth/register/route.ts`** — Rate limiting (3 registros/hora por IP) + salvamento de `birthDate` na criação do User

- **`src/app/api/auth/[...nextauth]/route.ts`** — Rate limiting no login:
  - Wrapper customizado no handler POST que intercepta `/callback/credentials`
  - 5 tentativas por 15 minutos por IP (conforme RN-AUTH-02)
  - Retorna 429 com header `Retry-After` quando excedido
  - Headers `X-RateLimit-Remaining` e `X-RateLimit-Reset` em todas as respostas

- **`src/app/api/contato/route.ts`** — Rate limiting adicionado (3 envios/hora por IP) conforme RN-CONTATO-05

### Decisões técnicas

- **Rate limiter in-memory em vez de Redis**: Para MVP, um Map-based store é suficiente. Em produção com múltiplas instâncias, migrar para Redis será necessário — a interface `checkRateLimit(key, config)` foi desenhada para facilitar essa troca
- **API separada para senha**: A troca de senha é uma operação sensível que requer verificação da senha atual e atualização na tabela nLogin (não na tabela users), justificando um endpoint dedicado
- **Profile fields nullable**: Novos campos do Profile (playtime, ranking, etc.) são nullable porque serão populados por jobs/scripts que sincronizam dados do servidor Minecraft — não são input direto do usuário
- **Notificações como String (VARCHAR)**: Em vez de Boolean, os campos de notificação usam String ("email", "push", "ambos", "off") para suportar múltiplos canais no futuro sem migração de schema

### Próximos passos (v0.6+)

1. **Recuperação de senha** — Rota `/recuperar-senha` com geração de token, envio de email e redefinição na tabela nLogin
2. **Envio de emails** — SMTP para: email de boas-vindas pós-registro, recuperação de senha, confirmação de contato
3. **Integração MercadoPago** — Checkout da loja com PIX, cartão e boleto conforme docs/paginas/05-loja.md
4. **APIs de dados reais** — Migrar dados mock do blog, loja, comunidade e cronograma para queries Prisma
5. **Rotas dinâmicas** — `/blog/[slug]`, `/aulas/[slug]`, `/comunidade/[categoria]/[topico]`
6. **CRUD do fórum** — Criação de tópicos, comentários, reações e moderação
7. **Desativar/Excluir conta** — Implementar endpoints para as ações da aba Perigo nas configurações
8. **Persistência do carrinho** — localStorage + banco de dados para carrinho da loja
9. **API de compras** — `GET /api/perfil/compras` com histórico real de pedidos
10. **Newsletter double opt-in** — API `/api/contato/newsletter` com token de confirmação e email
11. **Migrar rate limiter para Redis** — Quando deploy multi-instância for necessário
12. **Fonte Minecrafter** — Self-hosting da fonte customizada (substituir Press Start 2P)
13. **Admin panel** — CRUD de blog posts, produtos, gestão de usuários

---

## [v0.4.1] — 25/03/2026 — Integração nLogin-Web multi-algoritmo e conexão com banco de produção

### Adicionado

- **Módulo de algoritmos nLogin** (`src/lib/nlogin-algorithms.ts`) — Porta completa da biblioteca [nLogin-Web](https://github.com/nickuc-com/nLogin-Web) (PHP) para TypeScript/Node.js:
  - **BCrypt** (`$2a$`, `$2b$`, `$2y$`) — via `bcryptjs`
  - **SHA256** (`$SHA256$hash$salt`) — formato antigo e novo do nLogin
  - **SHA512** (`$SHA512$hash$salt`) — formato antigo e novo do nLogin
  - **AuthMe** (`$SHA$salt$hash$AUTHME`) — compatível com AuthMeReloaded
  - **Argon2** (`$argon2i$`, `$argon2id$`, `$argon2d$`) — via pacote `argon2` (carregado dinamicamente)
  - `detectAlgorithm()` — Detecção automática do algoritmo pelo prefixo do hash (idêntico ao `detect_algorithm()` do PHP)
  - `nloginVerifyPassword()` — Verificação de senha multi-algoritmo com timing-safe comparison
  - `nloginHashPassword()` — Geração de hash com algoritmo configurável (padrão: BCrypt)

- **Auto-criação de User no primeiro login** — Jogadores do Minecraft que logam no site pela primeira vez têm `User` + `Profile` criados automaticamente na tabela `users`/`profiles`

- **Script de criação de tabelas** (`scripts/create-tables.mjs`) — Criação direta via SQL das 15 tabelas do site no banco de produção (bypass do `prisma db push` que falhava por índice corrompido na tabela `plan_ping`)

### Modificado

- **Schema Prisma** (`prisma/schema.prisma`) — Model `Nlogin` corrigido para corresponder à estrutura real da tabela no banco:
  - `id` → mapeado para coluna `ai` (PK real do nLogin)
  - `ip` → mapeado para coluna `last_ip`
  - Removido `real_name` (não existe no banco)
  - `last_login`/`reg_date` (BigInt) → `last_seen`/`creation_date` (DateTime/Timestamp)
  - Adicionados campos `mojang_id`, `bedrock_id`, `email`, `discord`, `settings`
  - Índices `last_ip_idx` e `last_name_idx`

- **`src/lib/nlogin.ts`** — Refatorado para usar `nlogin-algorithms.ts`:
  - `hashPassword()` e `verifyPassword()` delegam para `nloginHashPassword()` e `nloginVerifyPassword()`
  - `createNloginEntry()` simplificado (banco usa `DEFAULT now()` para timestamps)
  - `updateNloginLastLogin()` atualiza `last_seen` com `new Date()`
  - Removida dependência direta do `bcryptjs`

- **`src/lib/auth.ts`** — Fluxo de login atualizado:
  - Tratamento de `password` nullable (retorna `null` se sem senha)
  - Auto-criação de `User` + `Profile` para jogadores existentes do Minecraft no primeiro login no site
  - Email temporário `username@craftsapiens.temp` quando o nLogin não tem email

- **`src/lib/prisma.ts`** — Conversão automática de `mysql://` para `mariadb://` no runtime (CLI do Prisma exige `mysql://`, adapter MariaDB exige `mariadb://`)

- **`.env`** — `DATABASE_URL` configurada para o banco de produção (host e credenciais ficam fora do repositório)

### Dependências adicionadas

- `argon2` — Suporte a hashes Argon2I/Argon2ID/Argon2D do nLogin

### Decisões técnicas

- **Multi-algoritmo em vez de só BCrypt**: O plugin nLogin suporta 5 algoritmos de hash diferentes dependendo da configuração do servidor. A detecção automática garante que jogadores com qualquer formato de hash possam logar no site sem migração forçada de senhas
- **Porta manual do PHP em vez de `nlogin-js`**: A biblioteca `nlogin-js` do npm está desatualizada (2022) e usa callbacks. Reimplementamos os algoritmos diretamente do [nLogin-Web](https://github.com/nickuc-com/nLogin-Web) oficial com suporte a Argon2D e timing-safe comparison
- **Criação de tabelas via SQL raw**: O `prisma db push` falhava com erro de índice corrompido na tabela `plan_ping` (plugin Plan do Minecraft). Script SQL direto permite criar apenas as tabelas do site sem tocar nas tabelas de plugins
- **Auto-criação de User**: Jogadores registrados no Minecraft via nLogin não precisam se registrar novamente no site — basta logar com as mesmas credenciais

---

## [v0.4] — 20/03/2026 — Autenticação nLogin completa, APIs de backend e proteção de rotas

### Adicionado

- **Autenticação nLogin completa** (`src/lib/auth.ts`) — Integração real do NextAuth v5 com o banco de dados nLogin do Minecraft:
  - Provider Credentials busca na tabela `nlogin` por username ou na tabela `users` por email
  - Verificação de senha via bcrypt (`$2a$`) compatível com nLogin (original e pirata)
  - Sessão JWT com campos customizados: id, username, email, role, nloginId
  - Atualização automática de `last_login` na tabela nLogin após login bem-sucedido
  - Sessão com duração de 30 dias

- **Módulo nLogin** (`src/lib/nlogin.ts`) — Funções utilitárias para integração com o plugin nLogin:
  - `hashPassword()` / `verifyPassword()` — Hashing bcrypt com salt rounds 10 (compatível com nLogin)
  - `findNloginByUsername()` / `findUserByEmail()` — Busca de credenciais
  - `createNloginEntry()` / `createUserWithProfile()` — Criação de registros nLogin + User + Profile em transação
  - `updateNloginPassword()` / `updateNloginLastLogin()` — Atualização de dados nLogin
  - Senha compartilhada entre site e servidor Minecraft via mesmo hash bcrypt

- **Tipos NextAuth** (`src/types/next-auth.d.ts`) — Extensão dos tipos de sessão e JWT do NextAuth com campos customizados (username, role, nloginId)

- **API de Registro** (`src/app/api/auth/register/route.ts`) — `POST /api/auth/register`:
  - Validação server-side: username (3-16 chars, alfanumérico + _), email, senha (8+ chars, letra + número), data de nascimento (13+ anos)
  - Verificação de unicidade: username na tabela `nlogin`, email na tabela `users`
  - Criação sequencial: registro nLogin → User → Profile com valores padrão
  - Hash bcrypt da senha compatível com nLogin
  - Respostas com códigos HTTP apropriados (201 Created, 400 Bad Request, 409 Conflict)

- **API de Verificação de Username** (`src/app/api/auth/check-username/route.ts`) — `GET /api/auth/check-username?username=`:
  - Consulta em tempo real se o username já existe na tabela `nlogin`
  - Validação de formato antes da consulta ao banco
  - Retorna `{ available: true/false }`

- **API de Contato** (`src/app/api/contato/route.ts`) — `POST /api/contato`:
  - Validação de todos os campos: nome (2-100 chars), email, categoria, mensagem (10-2000 chars)
  - Campo honeypot anti-bot (rejeição silenciosa)
  - Validação de categorias permitidas
  - Persistência na tabela `contact_messages` via Prisma

- **SessionProvider** (`src/app/providers.tsx`) — Wrapper client component com `SessionProvider` do NextAuth para disponibilizar sessão em toda a aplicação

- **Proteção de Rotas** (`src/proxy.ts`) — Proxy/middleware Next.js 16 com `auth()` do NextAuth:
  - Rotas protegidas (`/perfil/*`, `/loja/carrinho`) redirecionam para `/login?redirect=` se não autenticado
  - Rotas de auth (`/login`, `/registro`) redirecionam para `/perfil` se já autenticado
  - Preserva URL de redirect no query param para redirecionamento pós-login

### Modificado

- **`src/app/layout.tsx`** — Envolvido com `<Providers>` (SessionProvider) para disponibilizar sessão de autenticação em todos os componentes client

- **`src/lib/prisma.ts`** — Atualizado para Prisma 7 com adapter MariaDB (`@prisma/adapter-mariadb`):
  - `new PrismaClient({ adapter: new PrismaMariaDb(connectionString) })`
  - Compatível com MySQL/MariaDB existente do servidor Minecraft

- **`src/components/auth/LoginContent.tsx`** — Integração real com NextAuth:
  - `signIn("credentials", { redirect: false })` com tratamento de erros
  - Leitura de `?redirect=` via `useSearchParams()` para redirecionamento pós-login
  - Mensagem genérica de erro ("Username/email ou senha incorretos") por segurança
  - Redirecionamento automático para `/perfil` ou URL de redirect

- **`src/components/auth/RegistroContent.tsx`** — Integração com API de registro:
  - `POST /api/auth/register` com dados do formulário
  - Verificação de disponibilidade de username em tempo real (debounce 500ms via `useEffect`)
  - Indicador visual: Disponível / Em uso / Verificando (spinner Loader2)
  - Login automático após registro bem-sucedido via `signIn("credentials")`
  - Mensagem de sucesso antes do redirecionamento

- **`src/components/layout/Navbar.tsx`** — Estado de autenticação dinâmico:
  - **Não logado**: Botões "Login" e "Criar Conta Grátis" (comportamento original)
  - **Logado**: Avatar Minecraft (via mc-heads.net), username e dropdown com menu:
    - Meu Perfil → `/perfil`
    - Minhas Compras → `/perfil/compras`
    - Configurações → `/perfil/configuracoes`
    - Sair (signOut com redirect para `/`)
  - Dropdown fecha ao clicar fora (click outside listener)
  - Menu mobile atualizado com mesmo comportamento auth-aware

- **`src/components/home/HeroSection.tsx`** — CTA condicional conforme RN-HOME-01:
  - Logado: "Acessar Perfil" → `/perfil`
  - Não logado: "Iniciar Jornada Grátis" → `/registro`

- **`src/components/contato/ContatoContent.tsx`** — Formulário conectado à API real:
  - `POST /api/contato` em vez de simulação com setTimeout
  - Exibição de erros do servidor
  - Mantém campo honeypot anti-bot

- **`src/app/login/page.tsx`** — Adicionado `<Suspense>` boundary para `useSearchParams()` (requisito Next.js 16 para SSG)

### Dependências adicionadas

- `bcryptjs` + `@types/bcryptjs` — Hashing de senha compatível com nLogin ($2a$ bcrypt)
- `@prisma/adapter-mariadb` + `mariadb` — Adapter Prisma 7 para MySQL/MariaDB

### Decisões técnicas

- **bcryptjs em vez de bcrypt nativo**: Escolhido `bcryptjs` (JavaScript puro) por compatibilidade com Vercel Edge/Serverless sem necessidade de binários nativos. Produz hashes `$2a$` idênticos ao nLogin
- **Login por username OU email**: O authorize do NextAuth aceita tanto username (busca na tabela nLogin) quanto email (busca na tabela users → join com nLogin). Isso facilita o UX permitindo ambas as formas de login
- **Proxy.ts para Next.js 16**: Utilizado `proxy.ts` (substitui `middleware.ts` no Next.js 16) com a mesma API de middleware. Matcher restrito apenas às rotas que precisam de proteção
- **Adapter MariaDB para Prisma 7**: Prisma 7 exige adapter explícito. Utilizado `@prisma/adapter-mariadb` compatível com MySQL do servidor Minecraft existente
- **Mensagem genérica de erro no login**: Conforme RN-AUTH-02, mensagem de erro não revela se o username ou a senha estão incorretos (prevenção contra enumeração de usuários)
- **Verificação de username com debounce**: API de check-username é chamada 500ms após o último keystroke, evitando excess de requests sem sacrificar feedback real-time

### Próximos passos (v0.5+)

1. **Rate limiting** — Implementar rate limit por IP + username no login (5 tentativas / 15 min) e no formulário de contato (3/hora) conforme docs/paginas/07-auth.md e 08-contato.md
2. **Recuperação de senha** — Rota `/recuperar-senha` com geração de token, envio de email e redefinição na tabela nLogin
3. **Envio de emails** — SMTP para: email de boas-vindas pós-registro, recuperação de senha, confirmação de contato
4. **Newsletter double opt-in** — API `/api/contato/newsletter` com geração de token de confirmação e email
5. **Integração MercadoPago** — Checkout da loja com PIX, cartão e boleto conforme docs/paginas/05-loja.md
6. **APIs de dados reais** — Migrar dados mock do blog, loja, comunidade e cronograma para queries Prisma
7. **Rotas dinâmicas** — `/blog/[slug]`, `/aulas/[slug]`, `/comunidade/[categoria]/[topico]`
8. **CRUD do fórum** — Criação de tópicos, comentários, reações e moderação
9. **Perfil dinâmico** — Integrar dashboard do perfil com dados reais da sessão e banco de dados
10. **Persistência do carrinho** — localStorage + banco de dados para carrinho da loja
11. **Fonte Minecrafter** — Self-hosting da fonte customizada (substituir Press Start 2P)
12. **Admin panel** — CRUD de blog posts, produtos, gestão de usuários

---

## [v0.3] — 20/03/2026 — Implementação completa de todas as páginas restantes

### Adicionado

- **Página Cronograma** (`src/components/cronograma/CronogramaContent.tsx`) — Implementação conforme docs/paginas/04-cronograma.md:
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

- **Página Blog** (`src/components/blog/BlogContent.tsx`) — Implementação conforme docs/paginas/11-blog.md:
  - Hero com breadcrumb
  - Barra de busca global com ícone, filtra por título, resumo e tags
  - 7 categorias filtráveis (Todos, Novidades, Aulas, Eventos, Mídia, Tutoriais, Comunidade) com cores individuais
  - Post em destaque (primeiro post, card maior com imagem hero 21:9)
  - Grid responsivo de cards 3 colunas com: placeholder de imagem, badge de categoria colorido, título, resumo truncado (line-clamp-2), data, tempo de leitura
  - Paginação com navegação por números e setas
  - Estado vazio com ícone e mensagem quando nenhum post é encontrado
  - 9 posts mock com dados realistas (autores, categorias, tags, datas)
  - Links preparados para rota `/blog/[slug]`

- **Página Loja** (`src/components/loja/LojaContent.tsx`) — Implementação conforme docs/paginas/05-loja.md:
  - Hero com breadcrumb
  - Seção destaque "Planos VIP / Premium" com 3 cards comparativos (VIP, VIP+, Premium)
    - Cada plano com ícone, preço mensal, lista de features (incluída / não incluída), botão "Assinar"
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

- **Página Comunidade** (`src/components/comunidade/ComunidadeContent.tsx`) — Implementação conforme docs/paginas/06-comunidade.md:
  - Hero com breadcrumb dinâmico (muda conforme categoria aberta)
  - Barra de busca global do fórum
  - 7 categorias (Anúncios, Geral, Dúvidas, Sugestões, Bugs, Showroom, Off-Topic) com:
    - Emoji + ícone, nome, descrição, badge "STAFF" para categorias restritas
    - Contagem de tópicos e comentários
    - Último post com título, autor e tempo relativo
  - Navegação interna: clique em categoria → lista de tópicos
  - Lista de tópicos com: badges de fixado, fechado e resolvido, título, autor com cargo, contagem de comentários e views, tempo da última atividade
  - Botão "Novo Tópico" (requer implementação de auth)
  - Botão "Voltar" para retornar à lista de categorias
  - Barra de estatísticas (total de tópicos, comentários, membros)
  - Estado vazio para categorias sem tópicos
  - 6 tópicos mock na categoria "Geral" com variações de fixado/fechado

- **Página Perfil — Dashboard** (`src/components/perfil/PerfilContent.tsx`) — Implementação conforme docs/paginas/09-perfil.md:
  - Header do perfil com avatar Minecraft (via mc-heads.net), username, badge de rank (VIP+) com cor, badge de reputação (Veterano), data de registro, último acesso, botão "Editar Perfil"
  - 6 cards de métricas: Moedas SAPIENS, XP Total, Tempo Online, Aulas Concluídas, Ranking Geral, Plano Atual com expiração
  - Seção "Progresso de Aulas" com barras de progresso animadas (Framer Motion) por disciplina, cores individuais, percentual e contagem
  - Toggle "Ver todas / Ver menos" para lista de disciplinas
  - Seção "Atividade Recente" com timeline de 6 ações (login, aula, fórum, compra, conquista, milestone) com ícones e cores específicas
  - Links de navegação rápida: Minhas Compras, Configurações, Meu Ranking

- **Página Perfil — Compras** (`src/components/perfil/ComprasContent.tsx`) — Implementação conforme docs/paginas/09-perfil.md (RN-PERFIL-02):
  - Hero com breadcrumb de 3 níveis (Home > Perfil > Compras)
  - Banner de VIP ativo com data de expiração e botão "Renovar" → /loja
  - Resumo: total gasto e número de pedidos
  - Filtro por status (Todos, Aprovados, Pendentes, Cancelados, Reembolsados)
  - Lista de 6 pedidos mock com: produto, badge de status colorido (Aprovado, Pendente, Cancelado, Reembolsado), data, método de pagamento (PIX/Cartão/Boleto), código do pedido, valor
  - Estado vazio quando filtro não encontra resultados
  - Meta robots noindex, nofollow (página protegida)

- **Página Perfil — Configurações** (`src/components/perfil/ConfiguracoesContent.tsx`) — Implementação conforme docs/paginas/09-perfil.md (RN-PERFIL-03):
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
- **Página Sobre** (`src/components/sobre/SobreContent.tsx`) — Implementação conforme docs/paginas/02-sobre.md:
  - Timeline interativa (2020–2026) com items animados
  - Citação do fundador PH com card estilizado
  - Seção "Quem Somos" com placeholder para vídeo institucional
  - Cards de Missão, Visão e Valores com ícones
  - Grid de reconhecimento na mídia (6 veículos)
  - Grid da equipe (7 membros com avatar, nome, cargo)
  - Listagem da hierarquia do servidor (5 cargos com descrição)
- **Página Contato** (`src/components/contato/ContatoContent.tsx`) — Implementação conforme docs/paginas/08-contato.md:
  - 3 cards de canais de contato (WhatsApp, Email, Discord) com links diretos
  - Grid de redes sociais (7 redes com ícones e cores)
  - Formulário de contato com campos nome, email, assunto (select), mensagem (textarea), campo honeypot anti-bot
  - FAQ accordion (6 perguntas frequentes) com animação de abertura/fechamento
  - Seção de localização/horário de atendimento
- **Página Termos** (`src/components/termos/TermosContent.tsx`) — Implementação conforme docs/paginas/12-termos.md:
  - Toggle de abas Termos / Política de Privacidade
  - 13 seções de Termos e Condições completas
  - 8 seções de Política de Privacidade (LGPD)
  - Sidebar fixa com Table of Contents e scroll spy via IntersectionObserver
  - Botão de impressão
  - Meta de "última atualização"
- **Página Status do Servidor** (`src/components/status/StatusContent.tsx`) — Implementação conforme docs/paginas/10-status-servidor.md:
  - Painel de status em tempo real (fetch `/api/server-status` a cada 15s com auto-refresh)
  - Indicador online/offline com animação de pulso
  - Grid de estatísticas (jogadores, versão, MOTD, IP com botão copiar)
  - Sistema de abas de ranking (XP, Moedas, Tempo Online, Aulas) com dados mock
  - Tabela de ranking estilizada com medalhas (ouro/prata/bronze)
- **Página Aulas** (`src/components/aulas/AulasContent.tsx`) — Implementação conforme docs/paginas/03-aulas.md:
  - Seção "Como Funciona" com 4 cards explicativos do método gamificado
  - Catálogo de 8 disciplinas com ícone, cor, nível e quantidade de cursos
  - Barra de busca e filtro por nível (Fundamental/Médio/Todos)
  - Seção ENEM & Reforço com CTA
  - Seção informativa para pais com benefícios
- **Página Login aprimorada** (`src/components/auth/LoginContent.tsx`) — Melhorias no formulário de login:
  - Toggle de visibilidade de senha (eye icon)
  - Checkbox "Lembrar de mim"
  - Link "Esqueci a senha" para `/recuperar-senha`
  - Validação client-side, estado de loading e exibição de erros
  - Ícone Gamepad2 e título estilizado
- **Página Registro aprimorada** (`src/components/auth/RegistroContent.tsx`) — Implementação conforme docs/paginas/07-auth.md:
  - Campo username com validação (3-16 chars, alfanumérico + _) e indicador visual de válido/inválido
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
- **Página Home — Landing Page** (`src/app/page.tsx`) — Implementação com 6 seções:
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

- **Prisma generator `prisma-client-js`** em vez do novo `prisma-client` (v7 adapter-based): escolhido por estabilidade e compatibilidade com o ecossistema existente (decisão revista na v0.13, que passou a usar `@prisma/adapter-mariadb` e `@prisma/adapter-pg`)
- **Press Start 2P** como fallback de fonte Minecrafter: fonte Minecrafter custom será adicionada em versão futura; Press Start 2P (Google Fonts) oferece estética pixelada similar sem necessidade de self-hosting imediato
- **API mcsrvstat.us** como solução temporária para status do servidor: consulta TCP direta ao Minecraft Server List Ping será implementada em versão futura quando o backend tiver acesso direto ao servidor

---

## [v0.0.1] — 19/03/2026 — Criação do repositório

### Adicionado

- **Documentação de regras de negócio** — Criação da pasta `docs/` com especificações detalhadas de todas as páginas, componentes e funcionalidades do site
- **docs/README.md** — Visão geral do projeto, dados da CraftSapiens e índice da documentação
- **docs/stack-tecnica.md** — Definição da stack tecnológica (Next.js 14+ / TypeScript / Tailwind CSS / Prisma / MySQL), arquitetura do sistema, integração nLogin, gateway de pagamento (MercadoPago), estrutura de pastas e variáveis de ambiente
- **docs/design-system.md** — Design system: paleta de cores (tema Minecraft), tipografia (Minecrafter + Inter), espaçamento, breakpoints, componentes base (botões, cards, inputs, badges) e efeitos visuais
- **docs/paginas/01-home.md** — Landing page: hero "CONSTRUA SEU FUTURO JOGANDO", CTAs, cards de features (Aulas Gamificadas, Moeda SAPIENS, Enem & Reforço), seção "Como Funciona", status do servidor em tempo real, depoimentos e CTA final
- **docs/paginas/02-sobre.md** — Página Sobre: história da CraftSapiens, timeline, quem somos, missão/visão/valores, reconhecimento na mídia, equipe e hierarquia do servidor
- **docs/paginas/03-aulas.md** — Catálogo de aulas: método de ensino gamificado, grid de disciplinas com filtros (nível, disciplina, busca), detalhe por disciplina, seção ENEM & Reforço, seção para pais, modelo de dados de Disciplina e Aula
- **docs/paginas/04-cronograma.md** — Grade curricular: visão semanal/mensal, filtros, detalhes de aula (modal), próximas aulas com countdown, exportação para calendário (.ics), avisos de férias/recesso
- **docs/paginas/05-loja.md** — Loja: categorias (VIP/Premium, Ranks, Cosméticos, Moedas, Kits), comparativo de planos VIP, carrinho de compras, checkout com MercadoPago (PIX/cartão/boleto), ativação automática de produtos, sistema de cupons, modelo de dados de Produto/Pedido/Item/Cupom, regras de segurança
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
- Estrutura de documentação do projeto CraftSapiens
