# 🎨 Design System — CraftSapiens

> Baseado na identidade visual do Minecraft com toque educacional moderno.

---

## Paleta de Cores

### Cores Primárias

| Nome | Hex | Uso |
|------|-----|-----|
| **Verde CraftSapiens** | `#4CAF50` | CTAs principais, botões de ação, badges de sucesso |
| **Verde Escuro** | `#2E7D32` | Hover dos botões verdes, acentos |
| **Verde Claro** | `#81C784` | Backgrounds sutis, progress bars |

### Cores Secundárias

| Nome | Hex | Uso |
|------|-----|-----|
| **Marrom Minecraft** | `#8B6914` | Textos em estilo madeira, bordas temáticas |
| **Marrom Escuro** | `#5D4E37` | Backgrounds de cards, elementos rústicos |
| **Bege Pergaminho** | `#F5E6CC` | Fundos de cards sobre backgrounds escuros |

### Cores de Base

| Nome | Hex | Uso |
|------|-----|-----|
| **Cinza Escuro (BG)** | `#1A1A2E` | Background principal das páginas |
| **Cinza Médio** | `#16213E` | Cards, containers |
| **Cinza Claro** | `#0F3460` | Elementos secundários |
| **Branco** | `#FFFFFF` | Textos sobre fundo escuro |
| **Branco Suave** | `#E0E0E0` | Textos secundários |

### Cores de Feedback

| Nome | Hex | Uso |
|------|-----|-----|
| **Vermelho Erro** | `#E53935` | Erros, alertas, botões destrutivos |
| **Amarelo Aviso** | `#FFC107` | Avisos, badges de atenção |
| **Azul Info** | `#2196F3` | Links, informações, badges |
| **Roxo XP** | `#9C27B0` | XP, conquistas, elementos de gamificação |
| **Dourado Premium** | `#FFD700` | Badges VIP, elementos premium |

---

## Tipografia

### Fontes

| Fonte | Uso | Fallback |
|-------|-----|----------|
| **Minecraft (Minecrafter)** | Títulos hero, headlines principais, logo | `'Press Start 2P', monospace` |
| **Inter** | Textos de corpo, parágrafos, UI geral | `system-ui, sans-serif` |
| **JetBrains Mono** | Códigos, IPs de servidor, dados técnicos | `monospace` |

### Escala Tipográfica

| Elemento | Tamanho (Desktop) | Tamanho (Mobile) | Peso | Fonte |
|----------|-------------------|------------------|------|-------|
| **Hero Title** | 4rem (64px) | 2.5rem (40px) | 900 | Minecrafter |
| **H1** | 3rem (48px) | 2rem (32px) | 800 | Minecrafter |
| **H2** | 2.25rem (36px) | 1.75rem (28px) | 700 | Minecrafter |
| **H3** | 1.5rem (24px) | 1.25rem (20px) | 700 | Inter |
| **H4** | 1.25rem (20px) | 1.125rem (18px) | 600 | Inter |
| **Body Large** | 1.125rem (18px) | 1rem (16px) | 400 | Inter |
| **Body** | 1rem (16px) | 0.875rem (14px) | 400 | Inter |
| **Small** | 0.875rem (14px) | 0.75rem (12px) | 400 | Inter |
| **Caption** | 0.75rem (12px) | 0.75rem (12px) | 400 | Inter |
| **Code** | 0.875rem (14px) | 0.75rem (12px) | 400 | JetBrains Mono |

---

## Espaçamento

Base de 4px (sistema de 4-point grid).

| Token | Valor | Uso |
|-------|-------|-----|
| `space-1` | 4px | Gaps mínimos |
| `space-2` | 8px | Padding interno pequeno |
| `space-3` | 12px | Gaps entre elementos inline |
| `space-4` | 16px | Padding padrão de cards |
| `space-6` | 24px | Gaps entre seções menores |
| `space-8` | 32px | Padding de containers |
| `space-12` | 48px | Gap entre seções da página |
| `space-16` | 64px | Margem de seções grandes |
| `space-24` | 96px | Espaçamento entre blocos hero |

---

## Breakpoints (Responsividade)

| Nome | Largura | Dispositivo |
|------|---------|-------------|
| `sm` | 640px | Mobile grande |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Telas grandes |

---

## Componentes Base

### Botão Primário (CTA)

```
┌─────────────────────────────┐
│   INICIAR JORNADA GRÁTIS    │  ← Texto uppercase, bold
└─────────────────────────────┘
- Background: Verde CraftSapiens (#4CAF50)
- Texto: Branco (#FFFFFF), fonte Inter, bold, uppercase
- Border-radius: 8px
- Padding: 12px 32px
- Hover: Verde Escuro (#2E7D32) + sombra
- Transição: 200ms ease
- Efeito: leve "glow" verde no hover
```

### Botão Secundário (Outlined)

```
┌─────────────────────────────┐
│   VER GRADE CURRICULAR      │  ← Texto uppercase, bold
└─────────────────────────────┘
- Background: Transparente
- Borda: 2px solid Branco (#FFFFFF)
- Texto: Branco (#FFFFFF), fonte Inter, bold, uppercase
- Border-radius: 8px
- Padding: 12px 32px
- Hover: Background branco semi-transparente (rgba(255,255,255,0.1))
```

### Card de Feature

```
┌─────────────────────────────┐
│         [Ícone/Imagem]      │
│                             │
│     Título da Feature       │
│                             │
│  Descrição curta do que     │
│  esta feature oferece.      │
└─────────────────────────────┘
- Background: rgba(255,255,255,0.05) com backdrop-blur
- Borda: 1px solid rgba(255,255,255,0.1)
- Border-radius: 12px
- Padding: 24px
- Hover: borda muda para Verde CraftSapiens + leve scale(1.02)
- Sombra: 0 4px 24px rgba(0,0,0,0.3)
```

### Card de Produto (Loja)

```
┌─────────────────────────────┐
│       [Imagem Produto]      │
│                             │
│  Nome do Produto            │
│  Descrição breve            │
│                             │
│  R$ 29,90   [COMPRAR]       │
└─────────────────────────────┘
- Similar ao Card de Feature
- Badge de categoria no canto (VIP, Item, Rank)
- Preço em destaque (verde, bold, grande)
- Botão comprar: verde, compacto
```

### Input de Formulário

```
┌─────────────────────────────┐
│  Email ou Username          │  ← Placeholder
└─────────────────────────────┘
- Background: rgba(255,255,255,0.05)
- Borda: 1px solid rgba(255,255,255,0.2)
- Border-radius: 8px
- Padding: 12px 16px
- Texto: Branco
- Focus: borda Verde CraftSapiens + glow sutil
- Erro: borda Vermelho + mensagem abaixo
```

### Badge / Tag

```
┌──────────┐
│  VIP ⭐  │
└──────────┘
- Variantes: verde (padrão), dourado (premium), roxo (XP), vermelho (urgente)
- Border-radius: full (pill shape)
- Padding: 4px 12px
- Texto: pequeno, bold, uppercase
```

### Navbar (resumo visual)

```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo]  SOBRE  AULAS  CRONOGRAMA  LOJA  COMUNIDADE  [Login] [CTA]│
└──────────────────────────────────────────────────────────────────┘
- Background: semi-transparente com backdrop-blur
- Borda inferior sutil
- Logo à esquerda, links centralizados, auth à direita
- Mobile: hambúrguer menu
```

---

## Efeitos & Animações

| Efeito | Onde | Detalhes |
|--------|------|----------|
| **Partículas flutuantes** | Background global | Blocos de Minecraft, orbs de XP flutuando |
| **Fade-in on scroll** | Seções da página | Elementos aparecem suavemente ao scrollar |
| **Hover glow** | Botões, cards | Sombra colorida no hover |
| **Counter animation** | Números (jogadores online, etc.) | Contagem animada de 0 até o valor |
| **Parallax sutil** | Hero image | Imagem de fundo move em velocidade diferente |
| **Skeleton loading** | Cards, listas | Placeholder animado enquanto carrega |

---

## Ícones

| Biblioteca | Uso |
|------------|-----|
| **Lucide React** | Ícones de UI (setas, menus, ações) |
| **Custom SVGs** | Ícones temáticos Minecraft (espada, picareta, bloco, moeda SAPIENS) |

---

## Imagens & Assets

| Tipo | Formato | Otimização |
|------|---------|------------|
| **Logo CraftSapiens** | SVG | Vetorial, escalável |
| **Screenshots do servidor** | WebP | next/image com lazy loading |
| **Avatares de skin Minecraft** | API externa | `mc-heads.net` ou `crafatar.com` |
| **Ícones de features** | PNG/SVG | Sprites ou componentes individuais |
| **Background hero** | WebP | Comprimido, com fallback de cor sólida |
