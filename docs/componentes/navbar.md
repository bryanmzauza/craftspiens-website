# 🧭 Componente Global — Navbar

> **Componente**: `components/layout/Navbar.tsx`
> **Presente em**: Todas as páginas
> **Propósito**: Navegação principal do site.

---

## Regras de Negócio

### RN-NAV-01: Estrutura da Navbar

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [🏗️ Logo]  SOBRE  AULAS  CRONOGRAMA  LOJA  COMUNIDADE   [Login] [CRIAR CONTA GRÁTIS] │
└──────────────────────────────────────────────────────────────────────────────┘
```

#### Elementos (esquerda para direita):
1. **Logo CraftSapiens** — Imagem SVG, clicável → vai para `/`
2. **Links de navegação** (centralizados):
   - SOBRE → `/sobre`
   - AULAS → `/aulas`
   - CRONOGRAMA → `/cronograma`
   - LOJA → `/loja`
   - COMUNIDADE → `/comunidade`
3. **Área de autenticação** (direita):
   - **Não logado**: Botão "Login" (outline) + Botão "CRIAR CONTA GRÁTIS" (verde CTA)
   - **Logado**: Avatar (skin head) + Username + Dropdown

### RN-NAV-02: Estado Logado — Menu Dropdown

Ao clicar no avatar/username, exibe dropdown com:
- **Meu Perfil** → `/perfil`
- **Minhas Compras** → `/perfil/compras`
- **Configurações** → `/perfil/configuracoes`
- **Divisor**
- **Sair** (logout)

Se o usuário for Staff/Admin, adicionar:
- **Painel Admin** → `/admin`

### RN-NAV-03: Link Ativo
- O link da página atual deve ter estilo diferenciado:
  - Cor verde CraftSapiens
  - Underline animado (barra inferior)
- Detecção via `usePathname()` do Next.js

### RN-NAV-04: Notificações (Logado)
- Ícone de sino (🔔) ao lado do avatar
- Badge numérico com quantidade de notificações não lidas
- Ao clicar: dropdown com lista de notificações recentes (últimas 5)
- Link "Ver todas" → página de notificações ou modal completo
- Tipos: respostas no fórum, likes, lembretes de aulas, promoções

### RN-NAV-05: Status do Servidor (Mini)
- Indicador pequeno (opcional) na navbar:
  - 🟢 `42 online` (verde, jogadores online)
  - 🔴 `Offline` (vermelho)
- Clicável → vai para `/status`
- Atualiza a cada 60 segundos

### RN-NAV-06: Scroll Behavior
- **Posição fixa** (sticky) no topo da página
- **Background**: Transparente no topo da página (hero visible)
- **Ao scrollar**: Background escurece com `backdrop-blur` (glassmorphism)
  - `background: rgba(26, 26, 46, 0.9)`
  - `backdrop-filter: blur(10px)`
- Transição suave (200ms)
- Z-index alto (50+) para ficar acima de todo conteúdo

### RN-NAV-07: Mobile (Hambúrguer Menu)
- Em telas < 1024px (lg):
  - Links de navegação colapsam em ícone hambúrguer (☰)
  - Logo permanece visível
  - Botão CTA "CRIAR CONTA" pode virar ícone ou sumir
- Ao clicar no hambúrguer:
  - Menu lateral (sidebar) desliza da direita
  - Overlay escuro no fundo
  - Lista vertical com todos os links
  - Área de auth no final do menu
  - Fechar: botão X ou clique no overlay
  - Animação: slide-in 300ms ease

---

## Wireframe Textual

### Desktop (Não Logado)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐                                                              │
│  │ CRAFTSAPIENS │  SOBRE  AULAS  CRONOGRAMA  LOJA  COMUNIDADE               │
│  │ [Logo+Texto] │                                        [Login] [CRIAR CONTA]│
│  └─────────────┘                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Desktop (Logado)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ┌─────────────┐                                                              │
│  │ CRAFTSAPIENS │  SOBRE  AULAS  CRONOGRAMA  LOJA  COMUNIDADE               │
│  │ [Logo+Texto] │                              🟢 42   🔔(3)  [👤 Steve ▼] │
│  └─────────────┘                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                                         ┌─────────────────┐
                                                         │ 👤 Meu Perfil   │
                                                         │ 🛒 Minhas Compras│
                                                         │ ⚙️ Configurações │
                                                         │ ─────────────── │
                                                         │ 🚪 Sair         │
                                                         └─────────────────┘
```

### Mobile

```
┌──────────────────────────────┐
│  [Logo]              [☰]    │
└──────────────────────────────┘

           (ao abrir menu)

┌──────────────────────────────┐    ┌─────────────────┐
│  [Logo]              [X]    │    │                 │
└──────────────────────────────┘    │  SOBRE          │
│░░░░░░░░░░░░░░░░░░░░░░│    │  AULAS          │
│░░░░░░ overlay  ░░░░░░│    │  CRONOGRAMA     │
│░░░░░░░░░░░░░░░░░░░░░░│    │  LOJA           │
│░░░░░░░░░░░░░░░░░░░░░░│    │  COMUNIDADE     │
│░░░░░░░░░░░░░░░░░░░░░░│    │  ─────────────  │
│░░░░░░░░░░░░░░░░░░░░░░│    │  🟢 42 online   │
│░░░░░░░░░░░░░░░░░░░░░░│    │  ─────────────  │
│░░░░░░░░░░░░░░░░░░░░░░│    │  [Login]        │
│░░░░░░░░░░░░░░░░░░░░░░│    │  [CRIAR CONTA]  │
└──────────────────────────────┘    └─────────────────┘
```

---

## Props / Interface

```typescript
interface NavbarProps {
  // Controlado internamente via NextAuth session
}

// Links de navegação
const NAV_LINKS = [
  { label: 'SOBRE', href: '/sobre' },
  { label: 'AULAS', href: '/aulas' },
  { label: 'CRONOGRAMA', href: '/cronograma' },
  { label: 'LOJA', href: '/loja' },
  { label: 'COMUNIDADE', href: '/comunidade' },
];
```

---

## Estilização

| Propriedade | Valor |
|-------------|-------|
| **Posição** | `fixed top-0 w-full` |
| **Z-index** | `z-50` |
| **Background (topo)** | `transparent` |
| **Background (scroll)** | `rgba(26, 26, 46, 0.9)` + `backdrop-blur(10px)` |
| **Altura** | `64px` (desktop), `56px` (mobile) |
| **Borda inferior** | `1px solid rgba(255,255,255,0.1)` (só após scroll) |
| **Padding horizontal** | `24px` (desktop), `16px` (mobile) |
| **Transição** | `background 200ms ease, border 200ms ease` |
| **Links** | `text-white hover:text-green-400` |
| **Link ativo** | `text-green-400 border-b-2 border-green-400` |
