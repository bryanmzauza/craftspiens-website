# Página 05 — Loja

> **Rotas**: `/loja`, `/loja/comprar/[slug]`, `/loja/pedido/[id]`
> **Acesso**: Público (vitrine) / Logado, com nick vinculado e e-mail confirmado (comprar)
> **Propósito**: Venda de planos VIP e Premium, pacotes de Sapiens e cosméticos, com pagamento por Pix ou cartão e entrega automática no servidor.

---

## Decisões (v0.17)

| Tema | Decisão | Motivo |
|------|---------|--------|
| Gateway | MercadoPago, em dois caminhos: **Pix pela API de pagamentos** (QR Code no próprio site) e **cartão pelo Checkout Pro** (redireciona) | O Pix do MercadoPago cobra taxa percentual (0,99% na tabela padrão de 2026) sem valor fixo. Em um Sapiens de R$ 6, isso são R$ 0,06; um gateway com taxa fixa de R$ 0,80 levaria 13%. O SDK já estava no projeto |
| Boleto | Excluído (`excluded_payment_types: ticket`) | Taxa fixa alta para itens de poucos reais e compensação em dias |
| Carrinho | Removido. Cada compra é de **um produto** | Catálogo pequeno, entrega imediata: o carrinho só adicionava passos. Também simplifica a entrega e o reembolso |
| Entrega | O site só recebe o pagamento, confere que a conta do jogo existe (e se é Java ou Bedrock) e enfileira o item em `deliveries`. O plugin no **lobby** decide e executa os comandos (`docs/plugin-entregas.md`) | O site nunca escreve no banco do Minecraft; LuckPerms propaga do lobby para toda a rede |
| Planos anuais | VIP Anual e Premium Anual por 10 meses (2 meses grátis) | Incentivo para pagar o ano; alternância Mensal/Anual na vitrine |
| Combos | VIP e Premium mensais com os 5 cosméticos por 30 dias, por + R$ 9,90 (os permanentes somam R$ 54,50) | Vende mais por compra sem carrinho: é um produto próprio, oferecido no card do plano e na página de compra |
| Parcelamento | Cartão à vista ou em até 3x, com juros do Mercado Pago pagos por quem compra. A página de compra mostra parcela, juros (R$, %, taxa ao mês e ao ano) e total antes de pagar; o pedido guarda o que foi pago | A loja recebe o mesmo valor em qualquer opção; o comprador vê o custo do parcelamento antes de decidir (CDC, art. 52) |

---

## Catálogo

Definido em `scripts/seed-loja.mjs` (`npm run db:seed:loja`). Benefícios dos planos lidos dos grupos `vip`, `premium` e `vip_sg2` do LuckPerms em 10/10/2026.

| Produto (`slug`) | Preço | Duração | O que o plugin faz no lobby |
|------------------|------:|---------|-----------------------------|
| VIP (`vip`) | R$ 35,00 | 30 dias | grupo `vip` por 30 dias, acumulando |
| Premium (`premium`) | R$ 70,00 | 30 dias | grupo `premium` por 30 dias, acumulando |
| VIP Anual (`vip-anual`) | R$ 350,00 | 365 dias | grupo `vip` por 365 dias (10 meses pelo preço de 12) |
| Premium Anual (`premium-anual`) | R$ 700,00 | 365 dias | grupo `premium` por 365 dias |
| VIP + Cosméticos (`vip-cosmeticos`) | R$ 44,90 | 30 dias | grupo `vip` e as 5 permissões de cosmético por 30 dias, acumulando |
| Premium + Cosméticos (`premium-cosmeticos`) | R$ 79,90 | 30 dias | grupo `premium` e as 5 permissões de cosmético por 30 dias, acumulando |
| 1M / 3M / 20M Sapiens (`sapiens-1m`, `-3m`, `-20m`) | R$ 6 / 15 / 70 | — | credita a moeda quando o jogador está online |
| Rastro de Chamas / Corações / Notas / Estrelas (`rastro-*`) | R$ 9,90 cada | permanente | permissão `craftsapiens.rastro.<nome>` |
| Entrada Épica (`entrada-epica`) | R$ 14,90 | permanente | permissão `craftsapiens.entrada.epica` |

- O site não guarda comandos: a tabela slug para ação está em `docs/plugin-entregas.md` (seção 1.4) e no `products.yml` do plugin. Mudou um slug no seed, mude lá.
- Renovar antes do fim soma ao tempo que falta (`accumulate` do LuckPerms, aplicado pelo plugin).
- Estorno (`REFUNDED`) gera uma entrega do tipo `REVOKE`; o plugin remove o grupo ou a permissão.
- Cosméticos escolhidos para funcionar no Java e no Bedrock (partículas traduzidas pelo Geyser e fogos de artifício). Preços dos cosméticos são sugestão inicial.
- Combos: slug do plano mensal + `-cosmeticos` (`isCombo`, `comboSlug` em `components/loja/catalog-ui.tsx`). Ficam fora da grade de planos; o card do plano mensal oferece o combo e a página de compra alterna entre os dois. Os cosméticos do combo são temporários (`permission settemp ... accumulate`): renovar soma, e o estorno não mexe nos permanentes que o jogador já tiver. O acréscimo fica em `COMBO_ADDON_PRICE` no seed.

### O que o LuckPerms dá hoje (resumo usado na vitrine)

| Benefício | VIP | Premium |
|-----------|:---:|:-------:|
| Aulas exclusivas (principal benefício do Premium, primeiro item da lista dele) | Não | Sim |
| Tag no chat/tab | `[Vip]` amarela | `[Premium]` verde |
| Voar no Survival e no Geopolítico | Sim | Sim |
| Homes (HuskHomes) | 30 (1 pública) | 50 (2 públicas) |
| Teletransporte sem espera | Sim | Sim |
| Kits | VIP diário, semanal, mensal | Premium diário, semanal, mensal |
| Lojas de baú, placas coloridas, cores no chat, /hat, /enderchest | Sim | Sim |
| Desconto na loja do servidor e bônus ao vender | VIP (Survival) | Premium (Survival e Geopolítico) |
| XP de habilidades (AuraSkills) | +20% | +20% e +100% em Encantamento |
| Entrar no servidor cheio | Sim | Sim |
| Geopolítico: /nick colorido, brilho, manter XP | Sim | Sim |
| Warps e quiz exclusivos, área PremiumVIP | Não | Sim |

---

## Regras de Negócio

### RN-LOJA-01: Vitrine (`/loja`)
- Hero "LOJA" e faixa "Como funciona" em 3 passos (Pix no site, aprovação em segundos, entrega em toda a rede).
- Seções: **Planos** (alternância Mensal/Anual; Premium em destaque), **Sapiens** (3 pacotes, moeda da marca), **Cosméticos** (selo Java e Bedrock) e **Perguntas frequentes**.
- Planos anuais mostram o valor equivalente por mês e a economia em relação a 12 meses.
- Botões levam direto a `/loja/comprar/[slug]`; sem login, o proxy redireciona para `/login?redirect=...`.

### RN-LOJA-02: Compra (`/loja/comprar/[slug]`)
- Resumo do produto e benefícios; aviso de para qual nick a entrega vai.
- Exigências: nick vinculado (`SemNick`), conta do jogo existente no nLogin (`ContaJogoNaoEncontrada`; `GET /api/loja/conta-jogo` mostra nick e edição Java ou Bedrock antes de pagar), e-mail confirmado (`EmailNaoVerificado`), CPF válido de quem paga (`CpfObrigatorio`/`CpfInvalido`; fica salvo em `users.payer_cpf`), aceite dos termos (16 anos ou responsável).
- Cupom percentual (`POST /api/cupons/validar`).
- Planos mensais com combo: opção "Adicionar os cosméticos" troca o produto do pedido entre o plano e o combo, sem sair da página.
- Forma de pagamento: **Pix** (recomendado, sem juros) ou **Cartão** (Mercado Pago, à vista ou até 3x com juros).
- Cartão: tabela de parcelas com valor de cada parcela, juros em reais e em % sobre o valor, taxa efetiva ao mês e ao ano e total. As taxas vêm de `GET /api/loja/parcelas` (API de parcelas do Mercado Pago, Mastercard como referência, cache de 1 h); o cálculo em `src/lib/installments.ts` reproduz o do Mercado Pago (total = valor x (1 + taxa), parcela = total / n). Abaixo do mínimo do Mercado Pago (R$ 10 para 2x, R$ 15 para 3x) só aparece o à vista. Se a consulta falhar, a página avisa que os valores aparecem no Checkout Pro.
- `POST /api/loja/pedidos` `{ slug, method, couponCode?, cpf? }`:
  - cria `orders` (1 item, status `PENDING`, total mínimo R$ 1,00) e incrementa o uso do cupom;
  - Pix: cria o pagamento na API do MercadoPago (`payment_method_id: pix`, `date_of_expiration` em 30 min, `X-Idempotency-Key` = `pix-<pedido>`), guarda `pix_code`, `pix_qr_base64`, `pix_expires_at`; responde `{ orderId }`;
  - Cartão: cria a preferência do Checkout Pro (`back_urls` para `/loja/pedido/[id]`, boleto excluído, 3 parcelas) e responde `{ redirectUrl }`;
  - um Pix ainda válido (mais de 5 min) para o mesmo produto e valor é reaproveitado em vez de criar outro pedido;
  - erro no MercadoPago marca o pedido como `REJECTED` e responde 502.
- Limite: 8 pedidos por usuário a cada 15 min.

### RN-LOJA-03: Pedido (`/loja/pedido/[id]`)
- Consulta `GET /api/loja/pedido/[id]` a cada 4 s (16 s com a aba oculta) enquanto o pagamento está pendente ou a entrega em andamento. Limite de 120 consultas por 5 min.
- Pix pendente: QR Code (imagem base64 do MercadoPago), código copia e cola com botão copiar, contagem regressiva. Expirado: "Gerar novo Pix".
- Cartão pendente: aviso e botão para reabrir o Checkout Pro.
- Aprovado: lista de entregas com estado (Na fila / Ao entrar no servidor / Entregando / Entregue / Precisa de atenção).
- Recusado ou cancelado: "Tentar novamente" (volta para a compra do mesmo produto). Reembolsado: aviso de remoção dos benefícios.
- Só o dono do pedido (ou ADMIN) acessa.

### RN-LOJA-04: Webhook (`POST /api/loja/webhook`)
- Só notificações `type=payment` com assinatura `x-signature` válida; o pagamento é relido na API do MercadoPago.
- `approved` → `APPROVED` (exige BRL e valor ≥ total): `paid_at`, `installments` e `paid_amount` (valor pago com os juros do cartão, `transaction_details.total_paid_amount`), baixa de estoque e **criação das entregas** (`deliveries`, uma por item: slug, categoria, quantidade, dias, nick, UUID e edição do jogador) em uma transação idempotente; e-mail de confirmação.
- `rejected`/`cancelled` (inclui Pix expirado) → `REJECTED`. `refunded`/`charged_back` → `REFUNDED` com entregas `REVOKE`.
- O status nunca regride; notificações repetidas são ignoradas.
- Sem conta do jogo vinculada no momento da aprovação: pedido aprovado, entrega não criada e erro no log.

### RN-LOJA-05: Entregas (API do plugin)
- `GET /api/loja/entregas?servidor=&online=&limite=` com `Authorization: Bearer DELIVERY_API_TOKEN`: reserva atomicamente (`FOR UPDATE SKIP LOCKED`) as entregas `PENDING`; as que o plugin adiou até o jogador entrar só saem quando o UUID dele está em `online`. Reservas sem confirmação em 10 min voltam para a fila.
- `POST /api/loja/entregas/[id]` `{ servidor, ok, erro?, aguardarJogador? }`: `DELIVERED`; falha volta para `PENDING` até 5 tentativas e então `FAILED`; `aguardarJogador: true` volta para a fila sem contar tentativa e marca `requires_online`.
- Sem `DELIVERY_API_TOKEN` no `.env`, a API responde 503 e a fila espera.
- Contrato completo e briefing do plugin: `docs/plugin-entregas.md`.

### RN-LOJA-06: Histórico (`/perfil/compras`)
- Planos ativos com data de validade, calculada acumulando as compras aprovadas por família (VIP, Premium), como o `accumulate` do LuckPerms.
- Cada pedido mostra status, forma de pagamento, cupom, estado da entrega e botões "Pagar" (pendente) ou "Ver". Cartão parcelado mostra o valor pago, as parcelas e os juros; a página do pedido e o e-mail de confirmação também.

### RN-LOJA-07: Regras de contribuição
- Conforme os termos: maiores de 16 anos, ou compra feita por responsável; contribuição espontânea; benefícios podem mudar com 7 dias de aviso; VIP não isenta de punições.
- Checkbox obrigatório na compra: "Li e concordo com os Termos e Condições. Tenho 16 anos ou mais, ou a compra é feita por um responsável."

---

## Modelo de Dados (PostgreSQL)

### products (mudanças v0.17)

Removido: `server_command` (o plugin decide os comandos a partir do `slug`). A categoria continua o enum `VIP, RANK, COSMETICO, MOEDA, KIT`; a loja usa `VIP`, `MOEDA` (Sapiens) e `COSMETICO`.

### orders (mudanças v0.17)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `pix_code` | TEXT | Código copia e cola |
| `pix_qr_base64` | TEXT | QR Code em PNG base64 |
| `pix_expires_at` | TIMESTAMP | Validade do Pix (30 min) |
| `checkout_url` | VARCHAR(500) | Link do Checkout Pro (cartão) |
| `paid_at` | TIMESTAMP | Momento da aprovação |
| `installments` | INT | Parcelas do pagamento aprovado (1 no Pix e à vista) |
| `paid_amount` | DECIMAL(10,2) | Valor pago, com os juros do parcelamento; `total` continua sendo o preço do pedido |

`payment_method` guarda `pix` ao criar um Pix e, depois do webhook, o `payment_method_id` do MercadoPago (`pix`, `master`, `visa`...).

### deliveries (nova)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | TEXT (PK) | |
| `order_id`, `order_item_id`, `user_id`, `nlogin_id` | | Origem |
| `username`, `uuid` | VARCHAR | Nick e UUID do jogo (unique_id do nLogin com hífens) |
| `platform` | ENUM `JAVA`, `BEDROCK` | Edição da conta: `bedrock_id` preenchido no nLogin = Bedrock |
| `mojang_id`, `bedrock_id` | VARCHAR(32) | UUID da conta Java original e do Floodgate, quando existem |
| `kind` | ENUM `DELIVER`, `REVOKE` | |
| `product_slug`, `product_name`, `category`, `quantity`, `duration_days` | | O que foi comprado |
| `requires_online` | BOOLEAN | Marcado pelo plugin ao adiar até o jogador entrar |
| `status` | ENUM `PENDING`, `PROCESSING`, `DELIVERED`, `FAILED` | |
| `attempts`, `claimed_by`, `claimed_at`, `delivered_by`, `delivered_at`, `last_error` | | Rastreio |

Removida: `cart_items`.

---

## Segurança

- Preço e total sempre calculados no servidor; o cliente só envia o slug e o cupom.
- Pagamento confirmado exclusivamente pelo webhook assinado; a página do pedido apenas lê o status.
- O site não executa nem guarda comandos do servidor; só o plugin, com token, lê a fila.
- API de entregas com token de 32+ caracteres comparado em tempo constante; parâmetros validados por expressão regular; reserva atômica evita entrega dupla.
- Rate limit: 8 pedidos / 15 min, 120 consultas de pedido / 5 min, 10 cupons / 15 min.

---

## SEO

| Meta | Valor |
|------|-------|
| **Title** | Loja — CraftSapiens \| VIP, Premium, Sapiens e Cosméticos |
| **Description** | Planos VIP e Premium, pacotes de Sapiens e cosméticos para Java e Bedrock. Pague com Pix e receba automaticamente em todos os servidores da CraftSapiens. |

As páginas de compra e de pedido têm `robots: noindex`.
