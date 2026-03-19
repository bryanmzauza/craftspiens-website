# 🔐 Página 07 — Autenticação (Login / Registro)

> **Rotas**: `/login`, `/registro`, `/recuperar-senha`
> **Acesso**: Público (não autenticado)
> **Propósito**: Permitir que jogadores criem conta e façam login. A conta é compartilhada entre site e servidor Minecraft (via nLogin).

---

## Regras de Negócio

### RN-AUTH-01: Registro de Conta (`/registro`)

#### Campos do Formulário
| Campo | Tipo | Validação | Obrigatório |
|-------|------|-----------|:-----------:|
| **Username** | Texto | 3-16 caracteres, apenas letras, números e `_`. Deve ser um nick válido de Minecraft. | ✅ |
| **Email** | Email | Formato válido, único no banco | ✅ |
| **Senha** | Password | Mínimo 8 caracteres, pelo menos 1 letra e 1 número | ✅ |
| **Confirmar Senha** | Password | Deve coincidir com o campo Senha | ✅ |
| **Data de Nascimento** | Date | Deve ter pelo menos 13 anos | ✅ |
| **Aceitar Termos** | Checkbox | Deve ser marcado | ✅ |

#### Fluxo de Registro
1. Usuário preenche o formulário
2. Validação client-side em tempo real (debounced)
3. Submit → API valida:
   - Username não existe na tabela `nlogin`
   - Email não existe na tabela `users`
   - Todos os campos são válidos
4. Se válido:
   a. Hash da senha com **bcrypt** (salt rounds: 10) — mesmo algoritmo do nLogin
   b. Cria registro na tabela `nlogin` (username, password_hash, reg_date)
   c. Cria registro na tabela `users` (email, nlogin_id, role: "aluno", created_at)
   d. Cria registro na tabela `profiles` (user_id, avatar default)
5. Envia email de boas-vindas com instruções de como entrar no servidor
6. Faz login automático (cria sessão JWT)
7. Redireciona para `/perfil` (ou URL de redirect, se existir no query param)

#### Verificação de Disponibilidade (Live)
- Ao digitar o username, verificar em tempo real se já existe (debounce 500ms)
- Exibir ✅ "Disponível" ou ❌ "Username já em uso"
- Mesma verificação para email

### RN-AUTH-02: Login (`/login`)

#### Campos do Formulário
| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| **Username ou Email** | Texto | ✅ |
| **Senha** | Password | ✅ |
| **Lembrar de mim** | Checkbox | ❌ |

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

### RN-AUTH-03: Recuperação de Senha (`/recuperar-senha`)

#### Fluxo
1. Usuário informa email cadastrado
2. API verifica se email existe na tabela `users`
3. Se existe:
   a. Gera token de recuperação (aleatório, 64 caracteres, expira em 1h)
   b. Salva token hasheado no banco
   c. Envia email com link: `https://craftsapiens.com.br/redefinir-senha?token=xxx`
4. Se não existe: **mesma resposta** ("Se o email existir, enviaremos instruções") — evita enumeração
5. Ao acessar o link:
   a. Valida token (não expirado, não usado)
   b. Formulário: Nova senha + Confirmar nova senha
   c. Atualiza hash na tabela `nlogin` (atualiza para site E servidor simultaneamente)
   d. Invalida o token
   e. Redireciona para `/login` com mensagem de sucesso

### RN-AUTH-04: Integração nLogin
- O campo `password` na tabela do nLogin usa hash **bcrypt** com prefixo `$2a$`
- O site DEVE usar a mesma implementação de bcrypt para gerar e verificar hashes
- Quando o jogador troca a senha no site, a mudança vale imediatamente no servidor Minecraft
- Se o jogador trocar a senha no servidor (comando /changepassword), o site reconhece a nova senha automaticamente (lê do mesmo banco)

### RN-AUTH-05: Proteção de Rotas
- Páginas que requerem autenticação:
  - `/perfil` e sub-rotas
  - `/loja/carrinho` e checkout
  - Criar tópico/comentário no fórum
- Ao acessar rota protegida sem login: redireciona para `/login?redirect=/rota-original`
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
┌──────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│                    ┌─────────────────────────┐                    │
│                    │                         │                    │
│                    │  ⛏️ CRIAR CONTA GRÁTIS   │                    │
│                    │                         │                    │
│                    │  Username *             │                    │
│                    │  [________________] ✅   │                    │
│                    │                         │                    │
│                    │  Email *                │                    │
│                    │  [________________]     │                    │
│                    │                         │                    │
│                    │  Data de Nascimento *   │                    │
│                    │  [__/__/____]           │                    │
│                    │                         │                    │
│                    │  Senha *                │                    │
│                    │  [________________] 👁️   │                    │
│                    │  ████████░░ Forte       │                    │
│                    │                         │                    │
│                    │  Confirmar Senha *      │                    │
│                    │  [________________] 👁️   │                    │
│                    │                         │                    │
│                    │  ☐ Li e concordo com    │                    │
│                    │    os Termos e Condições │                    │
│                    │                         │                    │
│                    │  [  CRIAR MINHA CONTA  ]│                    │
│                    │                         │                    │
│                    │  Já tem conta? Faça     │                    │
│                    │  login aqui →           │                    │
│                    │                         │                    │
│                    └─────────────────────────┘                    │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└──────────────────────────────────────────────────────────────────┘
```

### Login (`/login`)

```
┌──────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│                    ┌─────────────────────────┐                    │
│                    │                         │                    │
│                    │  🎮 ENTRAR              │                    │
│                    │                         │                    │
│                    │  Username ou Email *    │                    │
│                    │  [________________]     │                    │
│                    │                         │                    │
│                    │  Senha *                │                    │
│                    │  [________________] 👁️   │                    │
│                    │                         │                    │
│                    │  ☐ Lembrar de mim       │                    │
│                    │         Esqueci a senha →│                    │
│                    │                         │                    │
│                    │  [      ENTRAR        ] │                    │
│                    │                         │                    │
│                    │  Não tem conta? Crie    │                    │
│                    │  uma grátis →           │                    │
│                    │                         │                    │
│                    └─────────────────────────┘                    │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└──────────────────────────────────────────────────────────────────┘
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
