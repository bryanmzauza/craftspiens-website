# Página 13 — Painel da equipe

> **Rota**: `/painel` (e `/painel/vendas`, `/painel/produtos`, `/painel/cupons`, `/painel/entregas`, `/painel/cronograma`, `/painel/atividade`)
> **Acesso**: só com o código de acesso definido em `PAINEL_CODIGO` no `.env` do servidor. Não depende da conta do site nem do cargo no jogo.
> **Propósito**: administrar a loja (produtos, preços, promoções, cupons), acompanhar vendas e entregas e montar o cronograma das aulas ao vivo.

---

## Acesso

| Tema | Decisão |
|------|---------|
| Como entra | Tela pede **nome** (aparece no registro de atividade) e **código de acesso**. O código certo cria um cookie `painel_sessao` (httpOnly, SameSite Strict, Secure em produção) válido por **12 horas** |
| Onde fica o código | Só na variável `PAINEL_CODIGO` do `.env` do servidor (mínimo de 12 caracteres). Nunca em arquivo do repositório, que é público |
| Painel desligado | Sem `PAINEL_CODIGO`, `/painel` mostra "indisponível" e as rotas `/api/painel` respondem 503 |
| Trocar o código | Basta mudar `PAINEL_CODIGO` e reiniciar o site. A assinatura do cookie usa o `AUTH_SECRET` junto com o código, então **todas as sessões abertas caem na hora** |
| Força bruta | 5 tentativas por IP a cada 15 minutos (`rate_limits`, chave `panel-unlock:<ip>`); tentativas erradas vão para o log do servidor com o IP |
| Conferência | O layout de `/painel` confere o cookie a cada requisição (nunca é pré-renderizado) e toda rota `/api/painel/*` confere de novo (`requirePanel` em `src/lib/painel/session.ts`). Escritas também exigem que a origem seja o próprio site |
| Navegação | Não há link para o painel no site; quem usa acessa `/painel` direto. A página tem `noindex` |

O código é comparado em tempo constante (hash SHA-256 dos dois lados). O nome é só identificação no registro: quem tem o código pode escrever qualquer nome, então o código deve ficar com poucas pessoas.

---

## Seções

### Visão geral (`/painel`)
- Período de 7, 30 ou 90 dias, comparado com o período anterior de mesmo tamanho.
- Receita (soma de `orders.total` dos pedidos aprovados, já com o cupom, sem os juros do cartão e antes das taxas do Mercado Pago), vendas, ticket médio e compradores únicos.
- Gráfico de receita por dia (fuso de São Paulo), com dica ao passar o mouse e opção "Ver tabela".
- "Precisa de atenção": entregas com falha ou travadas, Pix aguardando pagamento e reembolsos do período.
- Formas de pagamento (Pix e cartão), taxa de pedidos pagos, produtos e cupons ativos.
- Mais vendidos, receita por categoria, últimas vendas, próximas aulas e atividade recente.

### Vendas (`/painel/vendas`)
- Todos os pedidos, filtrados por status, período e busca (nick, e-mail, número do pedido, ID do Mercado Pago ou cupom). Os filtros ficam na URL.
- Exportação em CSV com os mesmos filtros (`;` como separador e BOM para o Excel; até 5.000 linhas; células que começam com `=`, `+`, `-` ou `@` ganham um apóstrofo para não virarem fórmula).
- Gaveta do pedido: comprador (nick, e-mail, compras anteriores), itens, cupom, pagamento (parcelas, valor com juros, ID no Mercado Pago, datas) e as entregas, com "Reenviar para o plugin".
- CPF, código Pix e QR Code **não** saem destas rotas.

### Produtos (`/painel/produtos`)
- Lista por seção da vitrine (Planos, Sapiens, Cosméticos, Outros), com vendas em 30 dias, total vendido e receita.
- Ações rápidas: trocar o preço clicando nele, ligar ou desligar na loja, destaque, promoção e ordem (setas).
- **Promoção**: escolhe o percentual; o preço cheio vira o preço riscado (`original_price`) e o novo preço é calculado. "Encerrar promoção" volta ao preço cheio.
- Editor com pré-visualização do card: nome, slug, categoria, preço, preço antigo, resumo, descrição, duração, selo, estoque (ou sem limite), cor, imagem (https), benefícios (incluso ou não, com ordem), visível na loja e destaque.
- Produto com pedidos: o **slug fica travado** (o plugin entrega pelo slug) e o produto não pode ser excluído, só desligado. Produto novo nasce fora da loja; antes de ligar, o slug precisa estar no `products.yml` do plugin ([plugin-entregas.md](../plugin-entregas.md)).

### Cupons (`/painel/cupons`)
- Cartões com código (clique copia), desconto, situação (ativo, desligado, vencido, esgotado), usos, vendas pagas, receita e desconto concedido.
- Editor: código (ou "Gerar"), desconto em %, limite de usos opcional, validade até 23h59 do dia escolhido (horário de Brasília) e ligado ou desligado.
- Cupom usado em algum pedido não troca de código nem é excluído; só é desligado.
- "Usos" conta todo pedido criado com o cupom (é o contador que a compra confere); "pagos" conta só os aprovados.

### Entregas (`/painel/entregas`)
- Abas: precisa de atenção (falhou, travada em "Entregando" há mais de 10 minutos ou com erro na fila), na fila, entregues e todas. Atualiza sozinha a cada 20 segundos.
- "Reenviar" zera as tentativas e devolve a entrega à fila (`POST /api/painel/entregas/[id]`).

### Cronograma (`/painel/cronograma`)
- Grade da semana (segunda a domingo) com as aulas posicionadas pelo horário; clicar num horário vazio marca uma aula ali; linha vermelha no horário atual. No celular, lista por dia.
- Editor da aula: disciplina (preenche nome e cor e liga à página da disciplina) ou nome livre, tema do dia, professor (sugere os já usados), nível, data, início, fim (atalhos de duração), local no jogo, cor e descrição.
- **Repetir por N semanas** (até 26) cria uma aula por semana na mesma série. Ao editar uma aula da série, dá para mudar só ela ou ela e as próximas (o horário de todas anda pelo mesmo tanto).
- **Cancelar** mantém a aula no cronograma, riscada, com o motivo. Excluir tira de vez.
- **Copiar semana anterior**: copia as aulas não canceladas, sem o tema do dia, sem duplicar as que já existem.
- **Aviso** no topo do `/cronograma` (férias, recesso), com data para sair do ar.
- **Texto para o Discord**: a semana formatada para colar no canal #cronograma-de-aulas.

### Atividade (`/painel/atividade`)
- Tudo o que foi feito no painel: quem (nome informado), o quê, em qual item, os valores antes e depois e quando. Filtro por tipo.

---

## Modelo de dados (PostgreSQL)

| Tabela | Uso |
|--------|-----|
| `scheduled_classes` | Aulas do cronograma: `title`, `topic`, `description`, `teacher`, `level`, `color`, `location`, `discipline_id` (opcional), `starts_at`, `ends_at`, `cancelled`, `cancel_reason`, `series_id`, `created_by` |
| `site_settings` | Configurações do painel em chave e valor JSON. Hoje: `cronograma.aviso` = `{ text, until }` |
| `panel_logs` | Registro de atividade: `actor`, `action` (ex.: `produto.preco`), `target`, `details` (JSON), `created_at` |

Produtos, cupons, pedidos e entregas usam as tabelas que já existiam.

---

## APIs

Todas exigem a sessão do painel; escritas exigem a origem do próprio site.

| Rota | Métodos | O que faz |
|------|---------|-----------|
| `/api/painel/acesso` | GET, POST, DELETE | Sessão atual; abrir com `{ codigo, nome }`; sair |
| `/api/painel/resumo?dias=` | GET | Números da visão geral |
| `/api/painel/vendas` | GET | Lista com filtros `status`, `q`, `de`, `ate`, `pagina` |
| `/api/painel/vendas/[id]` | GET | Pedido com entregas e histórico do comprador |
| `/api/painel/vendas/exportar` | GET | CSV com os mesmos filtros |
| `/api/painel/produtos` | GET, POST | Lista com vendas; criar |
| `/api/painel/produtos/[id]` | PUT, PATCH, DELETE | Salvar o formulário; ações rápidas (`preco`, `ativo`, `destaque`, `promocao`, `encerrarPromocao`); excluir sem pedidos |
| `/api/painel/produtos/ordem` | POST | Ordem de exibição `{ ids }` |
| `/api/painel/cupons` | GET, POST | Lista com vendas; criar |
| `/api/painel/cupons/[id]` | PUT, PATCH, DELETE | Salvar; ligar ou desligar; excluir sem pedidos |
| `/api/painel/entregas?filtro=` | GET | Fila do plugin |
| `/api/painel/entregas/[id]` | POST | `{ acao: "reenviar" }` |
| `/api/painel/cronograma?inicio=&fim=` | GET, POST | Aulas do intervalo, disciplinas, professores e aviso; criar (com `repeatWeeks`) |
| `/api/painel/cronograma/[id]` | PUT, PATCH, DELETE | Salvar (`scope`: `esta` ou `serie`); cancelar ou reativar; excluir (`?escopo=serie`) |
| `/api/painel/cronograma/copiar` | POST | `{ de, para }` (início das semanas) |
| `/api/painel/cronograma/aviso` | PUT, DELETE | Publicar ou remover o aviso |
| `/api/painel/atividade` | GET | Registro, com `tipo` e `pagina` |

A página pública usa `GET /api/cronograma?inicio=&fim=` (pública, só com os campos públicos da aula).

---

## Colocar no ar

1. Deploy com `--com-schema` (cria `scheduled_classes`, `site_settings` e `panel_logs`).
2. No `.env` do servidor: `PAINEL_CODIGO="<código longo>"` (por exemplo `openssl rand -base64 18`) e reiniciar o site.
3. Passar o código só para quem vai usar o painel, por um canal privado.
