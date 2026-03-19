# 🛒 Página 05 — Loja

> **Rota**: `/loja`, `/loja/[id]`, `/loja/carrinho`
> **Acesso**: Público (vitrine) / Logado (comprar)
> **Propósito**: Venda de planos VIP/Premium e itens in-game.

---

## Regras de Negócio

### RN-LOJA-01: Hero da Página
- Título: **"LOJA"** em fonte Minecraft
- Subtítulo: "Itens exclusivos e planos Premium para turbinar sua experiência."
- Breadcrumb: Home > Loja

### RN-LOJA-02: Categorias de Produtos
- A loja deve ter categorias bem definidas:
  1. **Planos VIP / Premium** — Assinaturas mensais/trimestrais/anuais
  2. **Ranks** — Títulos e ranks especiais no servidor
  3. **Cosméticos** — Itens visuais (partículas, efeitos, trails)
  4. **Moedas SAPIENS** — Pacotes de moedas para usar no servidor
  5. **Kits** — Pacotes de itens in-game
- Navegação por abas ou sidebar de categorias

### RN-LOJA-03: Card de Produto
- Cada produto exibe:
  - Imagem/ícone do produto (render do item Minecraft)
  - Nome do produto
  - Descrição curta
  - Preço (R$)
  - Badge de categoria (VIP, Rank, Cosmético, etc.)
  - Badge "MAIS VENDIDO" ou "NOVO" quando aplicável
  - Desconto (se houver): preço original riscado + novo preço
  - Botão "ADICIONAR AO CARRINHO"
- Hover: escala sutil + destaque na borda

### RN-LOJA-04: Página de Detalhe do Produto (`/loja/[id]`)
- Informações completas:
  - Imagem grande do produto
  - Nome, descrição detalhada
  - Preço
  - Lista de benefícios / itens inclusos
  - Duração (para VIPs: mensal, trimestral, anual)
  - Comparação com outros planos (para VIPs)
  - FAQ do produto
- Botão "COMPRAR AGORA" (direto pro checkout)
- Botão "ADICIONAR AO CARRINHO"
- Se não logado, botões redirecionam para `/login?redirect=/loja/[id]`

### RN-LOJA-05: Planos VIP / Premium (Destaque Especial)
- Seção destacada na loja com comparativo de planos:

| Feature | Gratuito | VIP | VIP+ | Premium |
|---------|:--------:|:---:|:----:|:-------:|
| Acesso ao servidor | ✅ | ✅ | ✅ | ✅ |
| Aulas básicas | ✅ | ✅ | ✅ | ✅ |
| Aulas avançadas | ❌ | ✅ | ✅ | ✅ |
| Aulas ENEM | ❌ | ❌ | ✅ | ✅ |
| Moedas SAPIENS bônus | ❌ | 100/mês | 300/mês | 500/mês |
| Rank exclusivo | ❌ | VIP | VIP+ | Premium |
| Cosméticos exclusivos | ❌ | ❌ | ✅ | ✅ |
| Suporte prioritário | ❌ | ❌ | ❌ | ✅ |
| Preço | Grátis | R$ X/mês | R$ Y/mês | R$ Z/mês |

- Card do plano recomendado deve ter badge "MAIS POPULAR" e borda destacada
- Preços configuráveis pelo admin

### RN-LOJA-06: Carrinho de Compras (`/loja/carrinho`)
- Lista de itens no carrinho:
  - Imagem miniatura
  - Nome do produto
  - Quantidade (editável para itens não-assinatura)
  - Preço unitário
  - Subtotal por item
  - Botão remover
- Resumo do pedido:
  - Subtotal
  - Desconto (se houver cupom)
  - Total
- Campo de cupom de desconto
- Botão "FINALIZAR COMPRA" → Vai para checkout
- Carrinho deve persistir entre sessões (localStorage se não logado, banco se logado)

### RN-LOJA-07: Checkout / Pagamento
- Resumo final do pedido
- Escolha de forma de pagamento:
  - **PIX** (preferencial — desconto de X%)
  - **Cartão de crédito** (parcela em até 3x sem juros)
  - **Boleto bancário** (prazo de 3 dias úteis)
- Integração com **MercadoPago** (API de pagamentos)
- Fluxo:
  1. Usuário clica "Pagar"
  2. Site cria preferência de pagamento via MercadoPago API
  3. Para PIX: exibe QR code + código copia e cola
  4. Para cartão: formulário de cartão (MercadoPago SDK)
  5. Para boleto: gera boleto e exibe link
  6. Webhook do MercadoPago notifica aprovação
  7. Sistema ativa o produto automaticamente
  8. Email de confirmação enviado

### RN-LOJA-08: Ativação de Produtos
- **VIP/Premium**: Atualiza grupo de permissões do jogador no servidor (via banco de dados ou API do plugin de permissões)
- **Itens in-game**: Salva na tabela de entregas pendentes. Quando jogador entra no servidor, recebe itens automaticamente
- **Moedas SAPIENS**: Credita diretamente na conta do jogador no banco de dados do servidor
- **Ranks**: Atualiza prefix/suffix no plugin de permissões

### RN-LOJA-09: Histórico de Compras (Logado)
- Acessível em `/perfil/compras` e como link na loja
- Lista de todas as compras com:
  - Data
  - Produto
  - Valor
  - Status (Aprovado, Pendente, Cancelado, Reembolsado)
  - Link para comprovante/nota
- Filtro por status e período

### RN-LOJA-10: Regras de Contribuição
- Conforme termos existentes:
  - Só podem contribuir maiores de 16 anos
  - Menores devem ter compra feita por responsável
  - Contribuição é espontânea para auxiliar na manutenção do servidor
  - Contrapartidas (VIP) podem ser alteradas/removidas com 7 dias de aviso
  - VIP não isenta de punições
  - Período de VIP conta mesmo quando banido (sem prorrogação)
- Checkbox obrigatório no checkout: "Li e concordo com os [Termos e Condições](/termos)"

---

## Wireframe Textual

### Vitrine (`/loja`)

```
┌──────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                          │
├──────────────────────────────────────────────────────────────────┤
│  Home > Loja                                                       │
│                                                                    │
│  ██████████                                                        │
│  █  LOJA  █                                                        │
│  ██████████                                                        │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                    ⭐ PLANOS VIP / PREMIUM                         │
│                                                                    │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐                    │
│  │   VIP    │  │  ★ VIP+  ★   │  │ PREMIUM  │                    │
│  │          │  │  MAIS POPULAR │  │          │                    │
│  │ R$X/mês  │  │  R$Y/mês     │  │ R$Z/mês  │                    │
│  │          │  │              │  │          │                    │
│  │ • Feat 1 │  │ • Feat 1     │  │ • Feat 1 │                    │
│  │ • Feat 2 │  │ • Feat 2     │  │ • Feat 2 │                    │
│  │          │  │ • Feat 3     │  │ • Feat 3 │                    │
│  │          │  │              │  │ • Feat 4 │                    │
│  │[ASSINAR] │  │ [ASSINAR]    │  │[ASSINAR] │                    │
│  └──────────┘  └──────────────┘  └──────────┘                    │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  Categorias: [Todos] [Ranks] [Cosméticos] [Moedas] [Kits]        │
│                                                                    │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│  │ [Imagem]   │  │ [Imagem]   │  │ [Imagem]   │  │ [Imagem]   │ │
│  │ Rank Gold  │  │ Trail Fire │  │ 500 Moedas │  │ Kit Início │ │
│  │ R$ 19,90   │  │ R$ 9,90    │  │ R$ 14,90   │  │ R$ 24,90   │ │
│  │[+ CARRINHO]│  │[+ CARRINHO]│  │[+ CARRINHO]│  │[+ CARRINHO]│ │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘ │
│                                                                    │
│  🛒 Carrinho (3 itens) — R$ 44,70            [VER CARRINHO →]    │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Carrinho (`/loja/carrinho`)

```
┌──────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                          │
├──────────────────────────────────────────────────────────────────┤
│  Home > Loja > Carrinho                                            │
│                                                                    │
│  SEU CARRINHO (3 itens)                                            │
│                                                                    │
│  ┌────────────────────────────────────────────────────────┐       │
│  │ [img] VIP+ Mensal          1x    R$ 29,90    [🗑️]     │       │
│  │ [img] Trail Fire           1x    R$  9,90    [🗑️]     │       │
│  │ [img] 500 Moedas SAPIENS   1x    R$ 14,90    [🗑️]     │       │
│  └────────────────────────────────────────────────────────┘       │
│                                                                    │
│  Cupom: [____________] [APLICAR]                                   │
│                                                                    │
│  ┌─────────────────────────┐                                      │
│  │ Subtotal:    R$ 54,70   │                                      │
│  │ Desconto:   -R$  0,00   │                                      │
│  │ ─────────────────────── │                                      │
│  │ TOTAL:       R$ 54,70   │                                      │
│  │                         │                                      │
│  │ [FINALIZAR COMPRA]      │                                      │
│  └─────────────────────────┘                                      │
│                                                                    │
│  ☐ Li e concordo com os Termos e Condições                        │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

### Produto

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `nome` | VARCHAR(200) | ✅ |
| `slug` | VARCHAR(200) UNIQUE | ✅ |
| `descricao` | TEXT | ✅ |
| `descricao_curta` | VARCHAR(255) | ✅ |
| `preco` | DECIMAL(10,2) | ✅ |
| `preco_original` | DECIMAL(10,2) | ❌ |
| `categoria` | ENUM (vip, rank, cosmetico, moeda, kit) | ✅ |
| `imagem` | VARCHAR(255) | ✅ |
| `duracao_dias` | INT | ❌ |
| `beneficios` | JSON | ✅ |
| `comando_servidor` | VARCHAR(500) | ❌ |
| `estoque` | INT (-1 = infinito) | ✅ |
| `ativo` | BOOLEAN | ✅ |
| `destaque` | BOOLEAN | ✅ |
| `ordem` | INT | ✅ |
| `created_at` | DATETIME | ✅ |

### Pedido (Order)

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `user_id` | INT (FK) | ✅ |
| `status` | ENUM (pendente, aprovado, cancelado, reembolsado) | ✅ |
| `subtotal` | DECIMAL(10,2) | ✅ |
| `desconto` | DECIMAL(10,2) | ✅ |
| `total` | DECIMAL(10,2) | ✅ |
| `cupom_id` | INT (FK) | ❌ |
| `metodo_pagamento` | ENUM (pix, cartao, boleto) | ✅ |
| `payment_id` | VARCHAR(255) | ❌ |
| `payment_status` | VARCHAR(100) | ❌ |
| `created_at` | DATETIME | ✅ |
| `paid_at` | DATETIME | ❌ |

### Item do Pedido

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `order_id` | INT (FK) | ✅ |
| `produto_id` | INT (FK) | ✅ |
| `quantidade` | INT | ✅ |
| `preco_unitario` | DECIMAL(10,2) | ✅ |
| `entregue` | BOOLEAN | ✅ |
| `entregue_at` | DATETIME | ❌ |

### Cupom de Desconto

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `codigo` | VARCHAR(50) UNIQUE | ✅ |
| `desconto_percentual` | DECIMAL(5,2) | ❌ |
| `desconto_fixo` | DECIMAL(10,2) | ❌ |
| `usos_max` | INT | ✅ |
| `usos_atual` | INT | ✅ |
| `valido_ate` | DATETIME | ✅ |
| `ativo` | BOOLEAN | ✅ |

---

## Segurança

- Validação de pagamento exclusivamente via webhook do MercadoPago (nunca confiar no front-end)
- Webhook deve validar assinatura/secret do MercadoPago
- Race condition: usar transação no banco para ativação de produto (evitar dupla ativação)
- Rate limit no endpoint de cupom (evitar brute force)
- Preços sempre verificados no back-end (nunca aceitar preço do front-end)

---

## SEO

| Meta | Valor |
|------|-------|
| **Title** | Loja — CraftSapiens \| Planos VIP e Itens Exclusivos |
| **Description** | Adquira planos VIP, ranks exclusivos, cosméticos e moedas SAPIENS na loja da CraftSapiens. Turbine sua experiência no Minecraft educacional. |
