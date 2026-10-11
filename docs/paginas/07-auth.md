# Página 07 — Autenticação (Login / Registro)

> **Rotas**: `/login`, `/registro`, `/recuperar-senha`
> **Acesso**: Público (não autenticado)
> **Propósito**: Permitir que jogadores criem conta e façam login. A conta é compartilhada entre site e servidor Minecraft (via nLogin).

---

## Regras de Negócio

### RN-AUTH-01: Registro de Conta (`/registro`)

#### Campos do Formulário
| Campo | Tipo | Validação | Obrigatório |
|-------|------|-----------|:-----------:|
| **Username** | Texto | 3-16 caracteres, apenas letras, números e `_`. Deve ser um nick válido de Minecraft. | Sim |
| **Email** | Email | Formato válido, único no banco | Sim |
| **Senha** | Password | Mínimo 8 caracteres, pelo menos 1 letra e 1 número | Sim |
| **Confirmar Senha** | Password | Deve coincidir com o campo Senha | Sim |
| **Data de Nascimento** | Date | Deve ter pelo menos 13 anos | Sim |
| **Aceitar Termos** | Checkbox | Deve ser marcado | Sim |

#### Fluxo de Registro
1. Usuário preenche o formulário
2. Validação client-side em tempo real (debounced)
3. Submit → API valida:
   - Username não existe na tabela `nlogin`
   - Email não existe na tabela `users`
   - Todos os campos são válidos
4. Se válido:
   a. Hash da senha com bcrypt (salt rounds: 10), o mesmo algoritmo usado pelo nLogin
   b. Cria registro na tabela `nlogin` (username, password_hash, reg_date)
   c. Cria registro na tabela `users` (email, nlogin_id, role: "aluno", created_at)
   d. Cria registro na tabela `profiles` (user_id, avatar default)
5. Envia email de boas-vindas com instruções de como entrar no servidor
6. Faz login automático (cria sessão JWT)
7. Redireciona para `/perfil` (ou URL de redirect, se existir no query param)

#### Verificação de Disponibilidade (Live)
- Ao digitar o username, verificar em tempo real se já existe (debounce 500ms)
- Exibir "Disponível" ou "Username já em uso"
- Mesma verificação para email

### RN-AUTH-02: Login (`/login`)

#### Campos do Formulário
| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| **Username ou Email** | Texto | Sim |
| **Senha** | Password | Sim |
| **Lembrar de mim** | Checkbox | Não |

#### Fluxo de Login
1. Usuário preenche username/email + senha
2. API busca na tabela `nlogin` (por username) ou `users` (por email)
3. Compara hash bcrypt da senha
4. Se válido:
   a. Cria sessão JWT via NextAuth.js
   b. Se "Lembrar de mim": sessão dura 30 dias. Senão: dura até fechar o navegador
   c. Atualiza `last_login` na tabela `nlogin`
   d. Redireciona para `/perfil` (ou URL de redirect)
5. Se inválido:
   - Mensagem genérica: "Username/email ou senha incorretos" (não revelar qual está errado)
   - Após 5 tentativas falhas em 15 minutos: bloquear por 30 minutos (rate limit por IP + username)

### RN-AUTH-02b: Login externo (Microsoft e Google)

> Implementação atual (v0.16). Detalhes em [docs/login-externo.md](../login-externo.md).

- **Entrar com Microsoft**: para quem já tem conta no servidor com conta original (Java) ou pelo Bedrock. O jogador é encontrado pelo `mojang_id` ou `bedrock_id` do nLogin; não cria contas do jogo.
- **Entrar com Google / Criar conta com Google**: cria uma conta no site sem nick. O nick é vinculado depois, em Configurações > Contas vinculadas, com a senha do servidor (ou pela Microsoft, para contas originais).
- Contas sem nick não compram na loja nem publicam no fórum.
- Se o e-mail do Google já pertence a uma conta com e-mail confirmado, o Google é vinculado a ela automaticamente e o login segue. Se o e-mail da conta ainda não foi confirmado, o login pelo Google é recusado: o dono entra com nick e senha e confirma o e-mail (ou vincula o Google em Configurações > Contas vinculadas).
- Os botões só aparecem quando as credenciais do provedor estão configuradas.

### RN-AUTH-02c: Confirmação de e-mail (`/confirmar-email`)

> Implementação atual (v0.16).

- Toda conta precisa de um e-mail confirmado para usar a plataforma: perfil, carrinho, compras, fórum e progresso das aulas. As páginas públicas continuam abertas.
- Vale para qualquer forma de entrar: nick e senha, cadastro pelo site e Microsoft. Contas criadas pelo Google já entram confirmadas, porque o Google verificou o e-mail.
- Contas com e-mail provisório (`@craftsapiens.temp`, criadas no primeiro acesso de quem não tinha e-mail no nLogin) precisam informar um e-mail real.
- Fluxo:
  1. Ao acessar uma página que exige confirmação, a conta vai para `/confirmar-email?redirect=<página>`
  2. O usuário informa o e-mail e recebe um código de 6 dígitos (`POST /api/conta/email/enviar`)
  3. Ao digitar o código (`POST /api/conta/email/confirmar`), o e-mail é gravado como confirmado e a sessão é atualizada
  4. O usuário volta para a página em que estava
- Alternativa ao código: **Confirmar com Google**. O botão vincula o Google à conta logada (`POST /api/perfil/vinculos/iniciar`, liberada mesmo sem e-mail confirmado) e, no retorno, o e-mail da conta Google passa a ser o e-mail confirmado da conta. Não vale para troca de e-mail, nem quando o e-mail do Google já pertence a outra conta; nesses casos, o usuário confirma pelo código.
- O código vale por 15 minutos e aceita 5 tentativas. Pedir um código novo invalida os anteriores. No banco fica só o hash do código (HMAC com `AUTH_SECRET`).
- Limites: 5 códigos e 10 tentativas de confirmação por conta a cada 15 minutos.
- O e-mail não pode pertencer a outra conta.
- Troca de e-mail: em Configurações, "Alterar e-mail" abre `/confirmar-email?alterar=1`. Se a conta já tem e-mail confirmado e senha no servidor, a troca pede a senha atual. O novo e-mail só passa a valer depois de confirmado, e o e-mail antigo recebe um aviso.
- As APIs que alteram dados respondem 403 com o código `EmailNaoVerificado` para contas sem e-mail confirmado; as consultas de leitura continuam liberadas.
- Em desenvolvimento, se o envio por SMTP falhar, o código aparece no terminal do servidor.

### RN-AUTH-03: Recuperação de Senha (`/recuperar-senha`)

#### Fluxo
1. Usuário informa email cadastrado
2. API verifica se email existe na tabela `users`
3. Se existe:
   a. Gera token de recuperação (aleatório, 64 caracteres, expira em 1h)
   b. Salva token hasheado no banco
   c. Envia email com link: `https://craftsapiens.com.br/redefinir-senha?token=xxx`
4. Se não existe: a resposta é a mesma ("Se o email existir, enviaremos instruções"), para evitar enumeração de emails
5. Ao acessar o link:
   a. Valida token (não expirado, não usado)
   b. Formulário: Nova senha + Confirmar nova senha
   c. Atualiza o hash na tabela `nlogin` (a alteração vale para o site e para o servidor ao mesmo tempo)
   d. Invalida o token
   e. Redireciona para `/login` com mensagem de sucesso

### RN-AUTH-04: Integração nLogin
- O campo `password` na tabela do nLogin usa hash bcrypt com prefixo `$2a$`
- O site deve usar a mesma implementação de bcrypt para gerar e verificar hashes
- Quando o jogador troca a senha no site, a mudança vale imediatamente no servidor Minecraft
- Se o jogador trocar a senha no servidor (comando /changepassword), o site reconhece a nova senha automaticamente (lê do mesmo banco)

### RN-AUTH-05: Proteção de Rotas
- Páginas que requerem autenticação:
  - `/perfil` e sub-rotas
  - `/loja/carrinho` e checkout
  - Criar tópico/comentário no fórum
- Ao acessar rota protegida sem login: redireciona para `/login?redirect=/rota-original`
- Logado sem e-mail confirmado: redireciona para `/confirmar-email?redirect=/rota-original` (RN-AUTH-02c)
- Após login bem-sucedido: redireciona para a URL do `redirect` param

### RN-AUTH-06: Logout
- Botão de logout no dropdown do perfil na navbar
- Invalida sessão JWT
- Limpa cookies
- Redireciona para `/`

---

## Wireframe Textual

### Registro (`/registro`)

```
┌────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                    ┌─────────────────────────┐                     │
│                    │                         │                     │
│                    │  CRIAR CONTA GRÁTIS     │                     │
│                    │                         │                     │
│                    │  Username *             │                     │
│                    │  [________________] [ok]│                     │
│                    │                         │                     │
│                    │  Email *                │                     │
│                    │  [________________]     │                     │
│                    │                         │                     │
│                    │  Data de Nascimento *   │                     │
│                    │  [__/__/____]           │                     │
│                    │                         │                     │
│                    │  Senha *                │                     │
│                    │  [_______________] [ver]│                     │
│                    │  ████████░░ Forte       │                     │
│                    │                         │                     │
│                    │  Confirmar Senha *      │                     │
│                    │  [_______________] [ver]│                     │
│                    │                         │                     │
│                    │  [ ] Li e concordo com  │                     │
│                    │      os Termos e        │                     │
│                    │      Condições          │                     │
│                    │                         │                     │
│                    │  [  CRIAR MINHA CONTA  ]│                     │
│                    │                         │                     │
│                    │  Já tem conta? Faça     │                     │
│                    │  login aqui →           │                     │
│                    │                         │                     │
│                    └─────────────────────────┘                     │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└────────────────────────────────────────────────────────────────────┘
```

### Login (`/login`)

```
┌────────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                           │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                    ┌─────────────────────────┐                     │
│                    │                         │                     │
│                    │  ENTRAR                 │                     │
│                    │                         │                     │
│                    │  Username ou Email *    │                     │
│                    │  [________________]     │                     │
│                    │                         │                     │
│                    │  Senha *                │                     │
│                    │  [_______________] [ver]│                     │
│                    │                         │                     │
│                    │  [ ] Lembrar de mim     │                     │
│                    │        Esqueci a senha →│                     │
│                    │                         │                     │
│                    │  [      ENTRAR        ] │                     │
│                    │                         │                     │
│                    │  Não tem conta? Crie    │                     │
│                    │  uma grátis →           │                     │
│                    │                         │                     │
│                    └─────────────────────────┘                     │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└────────────────────────────────────────────────────────────────────┘
```

---

## Segurança

| Medida | Implementação |
|--------|---------------|
| **Hash de senha** | bcrypt ($2a$, salt rounds: 10) — compatível com nLogin |
| **Sessão** | JWT via NextAuth.js, HTTP-only cookies, Secure, SameSite=Lax |
| **Rate limiting** | 5 tentativas de login / 15 min por IP+username |
| **Enumeração de email** | Mesma resposta para email existente/inexistente |
| **Token de recuperação** | 64 caracteres aleatórios, hasheado no banco, expira em 1h |
| **CSRF** | Token CSRF em todos os formulários |
| **XSS** | Sanitização de inputs, Content-Security-Policy |
| **Força da senha** | Indicador visual + validação server-side |

---

## SEO

| Meta | Valor |
|------|-------|
| **Title (Login)** | Login — CraftSapiens |
| **Title (Registro)** | Criar Conta — CraftSapiens \| O Maior Metaverso Educacional |
| **Description** | Crie sua conta grátis na CraftSapiens e comece a aprender jogando Minecraft. Mesma conta para o site e servidor. |
| **Robots** | noindex, nofollow (páginas de auth não devem ser indexadas) |
