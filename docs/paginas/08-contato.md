# 📞 Página 08 — Contato

> **Rota**: `/contato`
> **Acesso**: Público
> **Propósito**: Permitir que visitantes e alunos entrem em contato com a equipe CraftSapiens.

---

## Regras de Negócio

### RN-CONTATO-01: Hero da Página
- Título: **"CONTATO"** em fonte Minecraft
- Subtítulo: "Fale conosco! Estamos prontos para ajudar."
- Breadcrumb: Home > Contato

### RN-CONTATO-02: Informações de Contato
- Exibir cards com canais de contato:
  - **WhatsApp**: (41) 9 9587-1942 — Link direto para wa.me com mensagem pré-preenchida
  - **Email**: contato@craftsapiens.com.br — Link mailto
  - **Discord**: Link para convite do servidor Discord
- Cada card com ícone, texto e botão de ação
- Destaque: "Respondemos via WhatsApp mais rapidamente"

### RN-CONTATO-03: Redes Sociais
- Grid de ícones linkando para todas as redes:
  - Discord: discord.io/craftsapiens
  - Instagram: @universidadecraftsapiens
  - YouTube: canal oficial
  - Telegram: t.me/craftsapiens
  - TikTok: @craftsapiens
  - Twitter: @craftsapiens
  - Facebook: /UniversidadeCraftSapiens
- Ícones com hover colorido (cor da rede social)

### RN-CONTATO-04: Formulário de Contato
- Campos:
  | Campo | Tipo | Validação | Obrigatório |
  |-------|------|-----------|:-----------:|
  | Nome | Texto | 2-100 caracteres | ✅ |
  | Email | Email | Formato válido | ✅ |
  | Assunto | Select | Opções pré-definidas | ✅ |
  | Mensagem | Textarea | 10-2000 caracteres | ✅ |

- Opções de Assunto:
  - Dúvida sobre aulas
  - Suporte técnico (servidor)
  - Informações sobre planos VIP
  - Parceria / Mídia
  - Denúncia / Ouvidoria
  - Outro

- Ao enviar:
  1. Validação client-side e server-side
  2. Envia email para contato@craftsapiens.com.br (via SMTP)
  3. Salva registro no banco de dados (para tracking)
  4. Exibe mensagem de sucesso: "Mensagem enviada! Responderemos em até 10 dias úteis."
  5. Envia email de confirmação para o remetente

- Rate limit: máx 3 mensagens por hora por IP / email
- Honeypot field para anti-bot (campo invisível que bots preenchem)

### RN-CONTATO-05: FAQ Rápido
- Seção de perguntas frequentes em formato accordion:
  - "Como acesso o servidor?" → IP: jogar.craftsapiens.com.br + link para tutorial
  - "Quanto custa?" → Acesso básico é gratuito, planos VIP a partir de R$X
  - "Qual a idade mínima?" → 13 anos (menores devem ser acompanhados)
  - "Funciona no celular?" → Minecraft Java Edition (computador) recomendado
  - "Como funciona a Moeda SAPIENS?" → Explicação breve + link para /sobre
  - "Como ser Premium/VIP?" → Link para /loja
- Cada FAQ expansível (click to expand)

### RN-CONTATO-06: Mapa / Localização
- Texto informativo: "Localização: Porto Alegre, RS"
- Opcional: embed do Google Maps com localização genérica (cidade, não endereço exato)

### RN-CONTATO-07: Newsletter
- Campo de inscrição para novidades:
  - Email + botão "INSCREVER"
  - Checkbox: "Aceito receber emails sobre novidades da CraftSapiens"
  - Salva email no banco para envio de newsletters futuras
  - Confirmação de inscrição via email (double opt-in)

---

## Wireframe Textual

```
┌──────────────────────────────────────────────────────────────────┐
│ [NAVBAR]                                                          │
├──────────────────────────────────────────────────────────────────┤
│  Home > Contato                                                    │
│                                                                    │
│  ████████████████                                                  │
│  █   CONTATO   █                                                  │
│  ████████████████                                                  │
│  Fale conosco! Estamos prontos para ajudar.                        │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │ 📱 WhatsApp  │  │ 📧 Email     │  │ 💬 Discord   │            │
│  │ (41) 9 9587  │  │ contato@     │  │ Comunidade   │            │
│  │ -1942        │  │ craftsapiens │  │ online       │            │
│  │              │  │ .com.br      │  │              │            │
│  │ [CHAMAR]     │  │ [ENVIAR]     │  │ [ENTRAR]     │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                    │
│  ⚡ Respondemos via WhatsApp mais rapidamente                      │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  REDES SOCIAIS                                                     │
│                                                                    │
│  [Discord] [Instagram] [YouTube] [Telegram]                        │
│  [TikTok]  [Twitter]   [Facebook]                                  │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ENVIE UMA MENSAGEM                    FAQ RÁPIDO                  │
│                                                                    │
│  Nome *                                ▸ Como acesso o servidor?   │
│  [________________]                    ▸ Quanto custa?             │
│                                        ▸ Qual a idade mínima?     │
│  Email *                               ▸ Funciona no celular?     │
│  [________________]                    ▸ Como funciona a Moeda?    │
│                                        ▸ Como ser Premium?        │
│  Assunto *                                                         │
│  [Selecione... ▼]                                                  │
│                                                                    │
│  Mensagem *                                                        │
│  [________________________]                                        │
│  [________________________]                                        │
│  [________________________]                                        │
│                                                                    │
│  [ENVIAR MENSAGEM]                                                 │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  📍 Localização: Porto Alegre, RS                                  │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  📬 FIQUE POR DENTRO DAS NOVIDADES                                 │
│  [email________________] [INSCREVER]                               │
│  ☐ Aceito receber emails sobre novidades                           │
│                                                                    │
├──────────────────────────────────────────────────────────────────┤
│ [FOOTER]                                                           │
└──────────────────────────────────────────────────────────────────┘
```

---

## Modelo de Dados

### Mensagem de Contato

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `nome` | VARCHAR(100) | ✅ |
| `email` | VARCHAR(255) | ✅ |
| `assunto` | VARCHAR(100) | ✅ |
| `mensagem` | TEXT | ✅ |
| `status` | ENUM (nova, lida, respondida, arquivada) | ✅ |
| `ip` | VARCHAR(45) | ✅ |
| `created_at` | DATETIME | ✅ |

### Newsletter

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `id` | INT (PK) | ✅ |
| `email` | VARCHAR(255) UNIQUE | ✅ |
| `confirmado` | BOOLEAN | ✅ |
| `token` | VARCHAR(100) | ✅ |
| `created_at` | DATETIME | ✅ |
| `unsubscribed_at` | DATETIME | ❌ |

---

## SEO

| Meta | Valor |
|------|-------|
| **Title** | Contato — CraftSapiens \| Fale Conosco |
| **Description** | Entre em contato com a CraftSapiens. WhatsApp, email, Discord e formulário de contato. Respondemos em até 10 dias úteis. Porto Alegre, RS. |
