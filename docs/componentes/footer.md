# 🦶 Componente Global — Footer

> **Componente**: `components/layout/Footer.tsx`
> **Presente em**: Todas as páginas
> **Propósito**: Rodapé com links institucionais, redes sociais, contato e disclaimer legal.

---

## Regras de Negócio

### RN-FOOTER-01: Estrutura do Footer

O footer é dividido em 3 áreas principais:

#### Área Superior — Conteúdo Principal (4 colunas)

**Coluna 1: Logo & Sobre**
- Logo CraftSapiens (versão menor)
- Descrição curta: "O Maior Metaverso Educacional do Mundo"
- Redes sociais (ícones clicáveis):
  - Discord
  - YouTube
  - Instagram
  - TikTok
  - Twitter
  - Facebook
  - Telegram

**Coluna 2: Institucional**
- SOBRE → `/sobre`
- AULAS → `/aulas`
- CRONOGRAMA → `/cronograma`
- BLOG → `/blog`
- CONTATO → `/contato`

**Coluna 3: Suporte**
- Termos e Condições → `/termos`
- Política de Privacidade → `/privacidade`
- FAQ → `/contato#faq`
- Status do Servidor → `/status`

**Coluna 4: Contato**
- 📧 contato@craftsapiens.com.br
- 📱 (41) 9 9587-1942 (link WhatsApp)
- 📍 Porto Alegre, RS
- IP do Servidor: `jogar.craftsapiens.com.br` com botão copiar

#### Área Inferior — Copyright & Legal

```
Não afiliado à Mojang Studios. Minecraft é marca registrada de Mojang Synergies AB.
© 2026 CRAFTSAPIENS. Todos os direitos reservados. Localização: Porto Alegre, RS.
```

### RN-FOOTER-02: Newsletter (Opcional)
- Barra acima do footer com:
  - Texto: "Fique por dentro das novidades"
  - Input de email + botão "INSCREVER"
  - Integrado com o mesmo sistema de newsletter da página `/contato`

### RN-FOOTER-03: Redes Sociais
| Rede | Ícone | Link |
|------|-------|------|
| Discord | Discord icon | discord.io/craftsapiens |
| YouTube | YouTube icon | youtube.com/channel/UCdea6doNy_AypHr4S2tPUTw |
| Instagram | Instagram icon | instagram.com/universidadecraftsapiens |
| TikTok | TikTok icon | tiktok.com/@craftsapiens |
| Twitter/X | X icon | twitter.com/craftsapiens |
| Facebook | Facebook icon | facebook.com/UniversidadeCraftSapiens |
| Telegram | Telegram icon | t.me/craftsapiens |

- Ícones com hover colorido (cor da respectiva rede)
- `target="_blank"` + `rel="noopener noreferrer"` em todos os links externos

### RN-FOOTER-04: Link "CONTATO" em Destaque
- Conforme imagem de referência, o footer tem o texto "CONTATO" em destaque ao lado dos ícones de redes sociais
- Clicável → vai para `/contato`

---

## Wireframe Textual

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  📬 FIQUE POR DENTRO DAS NOVIDADES                                       │
│  [email________________________] [INSCREVER]                              │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ [Logo]       │  │ Institucional│  │ Suporte      │  │ Contato      │ │
│  │              │  │              │  │              │  │              │ │
│  │ O Maior      │  │ Sobre        │  │ Termos       │  │ 📧 contato@   │ │
│  │ Metaverso    │  │ Aulas        │  │ Privacidade  │  │ craftsapiens │ │
│  │ Educacional  │  │ Cronograma   │  │ FAQ          │  │ .com.br      │ │
│  │ do Mundo.    │  │ Blog         │  │ Status       │  │              │ │
│  │              │  │ Contato      │  │              │  │ 📱 (41) 9    │ │
│  │ [🎮][📺][📷] │  │              │  │              │  │ 9587-1942    │ │
│  │ [🎵][🐦][📘] │  │              │  │              │  │              │ │
│  │ [✈️]         │  │              │  │              │  │ 📍 Porto     │ │
│  │              │  │              │  │              │  │ Alegre, RS   │ │
│  │      CONTATO │  │              │  │              │  │              │ │
│  └─────────────┘  └──────────────┘  └──────────────┘  │ 🖥️ jogar.    │ │
│                                                        │ craftsapiens │ │
│                                                        │ .com.br [📋] │ │
│                                                        └──────────────┘ │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Não afiliado à Mojang Studios. Minecraft é marca registrada de          │
│  Mojang Synergies AB.                                                    │
│  © 2026 CRAFTSAPIENS. Todos os direitos reservados.                      │
│  Localização: Porto Alegre, RS.                                          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Estilização

| Propriedade | Valor |
|-------------|-------|
| **Background** | `#0D0D1A` (mais escuro que o body) |
| **Texto** | `#E0E0E0` (branco suave) |
| **Links** | `#A0A0A0` hover → `#4CAF50` (verde) |
| **Borda superior** | `1px solid rgba(255,255,255,0.05)` |
| **Padding** | `64px 24px` (área principal), `24px` (copyright) |
| **Divisor** | `1px solid rgba(255,255,255,0.1)` entre área principal e copyright |
| **Ícones de redes** | `24px`, cor `#A0A0A0`, hover → cor da rede |

---

## Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| **Desktop (lg+)** | 4 colunas lado a lado |
| **Tablet (md)** | 2 colunas (2x2) |
| **Mobile (sm)** | 1 coluna, empilhado, redes sociais centralizadas |
