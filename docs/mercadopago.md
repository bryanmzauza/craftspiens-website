# Mercado Pago: credenciais, webhook e testes

Como obter o `MERCADOPAGO_ACCESS_TOKEN` e o `MERCADOPAGO_WEBHOOK_SECRET` usados pela loja, primeiro em ambiente de teste e depois em produção. Passos conferidos na documentação oficial em 10/10/2026 ([credenciais](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/credentials), [webhooks](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/notifications/webhooks), [contas de teste](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/test/accounts)); os nomes dos menus podem mudar.

O que a loja usa:

| Variável | O que é | Onde fica no painel |
|----------|---------|---------------------|
| `MERCADOPAGO_ACCESS_TOKEN` | Chave privada da aplicação. Cria o Pix (API de pagamentos) e a preferência do cartão (Checkout Pro) e relê o pagamento no webhook. Só no servidor, nunca no navegador | Suas integrações > aplicação > Credenciais de teste ou Credenciais de produção |
| `MERCADOPAGO_WEBHOOK_SECRET` | Assinatura secreta que valida o cabeçalho `x-signature` das notificações | Suas integrações > aplicação > Webhooks > Configurar notificações |

A `Public Key` que aparece ao lado do Access Token não é usada: a loja não tem formulário de cartão no site.

---

## 1. Conta e aplicação

1. Entre em [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers/pt) com a conta do Mercado Pago **que vai receber o dinheiro** (a conta da CraftSapiens, não uma pessoal). Clique em **Entrar** no canto superior direito.
2. Clique em **Suas integrações** (canto superior direito) e em **Criar aplicação**.
3. Em **Escolha uma solução para integrar**, marque **Checkout Pro**. A escolha não limita as APIs: o mesmo Access Token cria o Pix pela API de pagamentos, e não é preciso criar outra aplicação. Ela só muda a documentação sugerida e os critérios de "Qualidade de integração".
4. Abra **Outros dados** e preencha:
   - **Nome**: `CraftSapiens Loja` (aparece só para você).
   - Se perguntar: não usa plataforma de e-commerce; modelo de integração vendedor (não marketplace).
5. Aceite os termos e clique em **Criar aplicação**. A aplicação abre com um menu à esquerda: **Testes** (Contas de teste, Credenciais de teste), **Produção** (Credenciais de produção), **Webhooks** e **Qualidade de integração**.

Guarde o número da aplicação (aparece no topo); o suporte do Mercado Pago pede por ele.

## 2. Credenciais de teste (desenvolvimento)

As credenciais de teste não precisam ser ativadas e não movimentam dinheiro.

1. No menu à esquerda, **Testes > Credenciais de teste**.
2. Copie o **Access Token** (começa com `TEST-` ou `APP_USR-`, conforme a conta; o painel indica que é de teste).
3. No `.env` local:

   ```env
   MERCADOPAGO_ACCESS_TOKEN="<Access Token de teste>"
   ```

### Contas de teste

Para simular uma compra inteira é preciso um comprador fictício. Em **Testes > Contas de teste**:

1. **+ Criar conta de teste**, país **Brasil** (não pode ser alterado depois; comprador e vendedor precisam ser do mesmo país), descrição `Comprador`, tipo **Comprador**, saldo fictício de R$ 1.000,00. Aceite os termos e crie.
2. Anote **Usuário** e **Senha** da tabela. Se o login pedir um código de 6 dígitos, ele aparece na própria tabela de contas de teste.
3. Dá para criar até 15 contas; hoje elas não podem ser excluídas.
4. Com credenciais de teste, o Mercado Pago só aceita como pagador uma conta de teste compradora: com o e-mail real do aluno, a criação do pagamento falha com `Unauthorized use of live credentials`. Coloque o e-mail da conta compradora no `.env` local, em `MERCADOPAGO_TEST_PAYER_EMAIL`; o site usa esse e-mail no lugar do e-mail do aluno (só fora de produção).

Para pagar com cartão de teste, abra uma janela anônima, entre com a conta comprador e use os [cartões de teste](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards) (nome do titular `APRO` aprova, `OTHE` recusa). O Pix de teste gera um QR Code válido para a integração, mas que não é pago por aplicativos de banco reais; o fluxo completo do Pix (QR Code na tela, webhook aprovando, entrega na fila) é testado em produção com um valor pequeno, como R$ 1,00, e depois reembolsado.

## 3. Webhook e assinatura secreta

O webhook é o que aprova o pedido, cria a entrega e envia o e-mail. Sem ele, o Pix é pago e o pedido fica pendente.

1. No menu à esquerda, **Webhooks > Configurar notificações**.
2. Preencha as URLs:
   - **URL modo teste**: a URL pública do seu ambiente de desenvolvimento, terminando em `/api/loja/webhook`. O Mercado Pago não alcança `localhost`; use um túnel (`cloudflared tunnel --url http://localhost:3000` ou `ngrok http 3000`) e cole a URL gerada. Com `AUTH_URL` em `http://localhost`, o site não envia `notification_url` em cada pagamento (o Mercado Pago recusa endereço local com o erro 4020) e as notificações seguem só esta URL do painel.
   - **URL modo produção**: `https://craftsapiens.com.br/api/loja/webhook`.
3. Em **Eventos**, marque **Pagamentos** (tópico `payment`). É o único que a loja trata; os demais são aceitos e ignorados.
4. Clique em **Salvar**. O painel gera a **assinatura secreta** da aplicação. Clique para revelar e copie.
5. No `.env`:

   ```env
   MERCADOPAGO_WEBHOOK_SECRET="<assinatura secreta>"
   ```

   Reinicie o site. Sem essa variável o webhook responde 503 e não processa nada.

Observações:

- A assinatura é a mesma para teste e produção e não expira. O botão de redefinir ao lado dela gera outra; se usar, atualize o `.env` na hora.
- A URL informada na criação de cada pagamento (`notification_url`, que a loja já envia) tem prioridade sobre a configurada no painel. Mesmo assim, configure o painel: é lá que fica a assinatura.
- Em **Webhooks** o painel mostra as notificações recentes, o status de entrega e o JSON enviado. Uma notificação com falha pode ser reenviada por ali; a loja ignora repetições.
- O Mercado Pago espera resposta 200 ou 201 em até 22 segundos; sem ela, reenvia a cada 15 minutos por um tempo.
- Na Cloudflare, a rota `/api/loja/webhook` precisa de uma regra de WAF que pule os desafios (ver `docs/arquitetura-producao.md`, seção 8); o Mercado Pago não resolve captcha.

## 4. Credenciais de produção

1. No menu à esquerda, **Produção > Credenciais de produção**.
2. Se aparecer o aviso de ativação, preencha:
   - **Indústria**: escolha o setor mais próximo (entretenimento ou educação).
   - **Website (obrigatório)**: `https://craftsapiens.com.br`.
   - Aceite a **Declaração de Privacidade** e os **Termos e condições**, resolva o reCAPTCHA e clique em **Ativar credenciais de produção**.
3. Copie o **Access Token** de produção (começa com `APP_USR-`).
4. No `.env` **do servidor** (nunca no repositório):

   ```env
   MERCADOPAGO_ACCESS_TOKEN="APP_USR-..."
   MERCADOPAGO_WEBHOOK_SECRET="<a mesma assinatura da seção 3>"
   ```

5. Reinicie o site.

### Chave Pix na conta

O Pix pela API só funciona se a conta do Mercado Pago tiver uma **chave Pix cadastrada**. No app ou site do Mercado Pago: **Pix > Suas chaves > Cadastrar chave** (CNPJ, e-mail ou chave aleatória). Sem a chave, a criação do pagamento falha e a loja responde "Não foi possível iniciar o pagamento".

### Parcelamento

A página de compra simula as parcelas com as taxas que a API do Mercado Pago devolve para a conta (`GET /v1/payment_methods/installments`), então o valor exibido acompanha a conta em uso: com o token de teste aparecem as taxas de teste; com o de produção, as reais. Os juros ficam com quem compra. Se a conta for configurada para oferecer parcelas sem juros (o vendedor paga a taxa), a API devolve taxa 0 e a página passa a mostrar "Sem juros" sozinha. Confira a configuração em **Seu negócio > Custos**.

### Dados da conta

Para receber valores sem bloqueio, a conta precisa estar com os dados verificados (documento e, no caso de empresa, CNPJ). Faça isso antes da primeira venda real, em **Seu perfil > Seus dados**, no site do Mercado Pago. As taxas aplicadas (Pix, cartão, prazo de liberação) ficam em **Seu negócio > Custos**; confira o valor do Pix antes de divulgar a loja.

## 5. Checklist antes de vender

- [ ] Access Token de produção no `.env` do servidor e site reiniciado.
- [ ] Webhook de produção salvo com o evento **Pagamentos** e a assinatura no `.env`.
- [ ] Chave Pix cadastrada na conta.
- [ ] Compra real de teste de um cosmético (R$ 9,90) ou de um produto temporário de R$ 1,00: QR Code aparece, o pagamento é aprovado, o pedido muda para aprovado sozinho, a entrega aparece em `deliveries` e o e-mail chega. Depois, reembolse pelo painel do Mercado Pago (**Atividade > pagamento > Reembolsar**) e confira que o pedido virou "Reembolsado" e a entrega de estorno foi criada.
- [ ] Compra com cartão de teste em ambiente de teste (nome `APRO`) para validar o Checkout Pro.

## 6. Segurança e renovação

- O Access Token dá acesso total à conta (criar pagamentos, reembolsar, consultar). Trate como senha: só no `.env` do servidor, nunca em commits, prints ou mensagens.
- Se vazar, em **Credenciais de produção** clique nos três pontos ao lado da credencial, **Renovar** e **Renovar agora**. As duas credenciais do par mudam; atualize o `.env` e reinicie o site. A assinatura do webhook é renovada separadamente, em **Webhooks**.
- Em caso de dúvida se o token em uso é de teste ou produção: o de teste não cria pagamentos reais e o painel marca a aba de origem.

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---------|----------------|-------------|
| "Não foi possível iniciar o pagamento" ao gerar o Pix | Token inválido, token de teste em produção, ou conta sem chave Pix | Conferir o token no `.env`; cadastrar a chave Pix |
| Mesma mensagem em desenvolvimento, com `Unauthorized use of live credentials` no log `[pedidos]` | Credenciais de teste com o e-mail real do aluno como pagador | Preencher `MERCADOPAGO_TEST_PAYER_EMAIL` com o e-mail da conta de teste compradora |
| Pix pago e pedido continua "Aguardando pagamento" | Webhook não chega (URL errada, Cloudflare bloqueando) ou assinatura diferente | Painel > Webhooks: ver status das notificações; logs `[webhook]` do site |
| Webhook responde 401 no painel | `MERCADOPAGO_WEBHOOK_SECRET` diferente da assinatura atual | Copiar a assinatura de novo e reiniciar |
| Webhook responde 503 | Variável ausente no `.env` | Preencher e reiniciar |
| Checkout Pro abre, mas o retorno não mostra o pedido | Sessão expirada no navegador | Entrar de novo; o pedido está em `/perfil/compras` |
