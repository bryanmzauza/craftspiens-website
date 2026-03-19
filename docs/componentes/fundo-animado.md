# ✨ Componente Global — Fundo Animado (Animated Background)

> **Componente**: `components/layout/AnimatedBackground.tsx`
> **Presente em**: Todas as páginas (layer atrás do conteúdo)
> **Propósito**: Background animado com partículas estilo Minecraft para dar vida e identidade visual ao site.

---

## Regras de Negócio

### RN-BG-01: Conceito Visual
- Background escuro (`#1A1A2E`) com partículas flutuantes temáticas do Minecraft
- As partículas devem criar uma atmosfera imersiva sem distrair do conteúdo
- Opacidade baixa para não competir com o conteúdo (20-40% de opacidade)
- Movimentação suave e contínua (não caótico)

### RN-BG-02: Tipos de Partículas

| Partícula | Aparência | Comportamento | Quantidade |
|-----------|-----------|---------------|------------|
| **Blocos pequenos** | Quadrados pixelados (8x8px) em tons de verde/marrom | Flutuam de baixo para cima, lentamente, com leve oscilação horizontal | 15-20 |
| **Orbs de XP** | Esferas verde-amareladas com glow | Flutuam e pulsam (scale 0.8 → 1.2), movem-se em arco suave | 8-12 |
| **Estrelas/Brilhos** | Pontos brancos pequenos (2-4px) | Aparecem e desaparecem (fade in/out) em posições aleatórias | 20-30 |
| **Partículas de poeira** | Pontos cinza muito sutis | Drift horizontal lento, como poeira flutuando | 10-15 |

### RN-BG-03: Comportamento da Animação

#### Movimento
- **Direção principal**: De baixo para cima (gravidade invertida, como no Minecraft quando itens são droppados)
- **Velocidade**: Variável por partícula (0.2px - 1px por frame) — lento e relaxante
- **Oscilação**: Movimento senoidal horizontal sutil (amplitude: 20-50px)
- **Rotação**: Blocos rotacionam lentamente (0.5-2 graus por frame)

#### Ciclo de Vida
1. Partícula nasce na parte inferior da tela (ou posição aleatória no início)
2. Sobe lentamente com oscilação
3. Ao sair da tela (topo), reaparece na parte inferior em posição horizontal aleatória
4. Orbs de XP: adicionam pulsação (scale) durante o trajeto

#### Parallax com Scroll
- Partículas em diferentes "camadas" de profundidade (parallax layers)
  - **Layer 1 (fundo)**: Partículas menores, mais lentas, mais transparentes
  - **Layer 2 (meio)**: Partículas médias, velocidade normal
  - **Layer 3 (frente)**: Partículas maiores, mais rápidas, mais opacas (poucas)
- Ao scrollar a página, layers se movem em velocidades diferentes

#### Interação com Mouse (Desktop - opcional)
- Partículas próximas ao cursor sofrem leve repulsão/atração
- Raio de influência: 100px
- Efeito sutil, não deve ser distrativo
- Desabilitado em dispositivos touch

### RN-BG-04: Implementação Técnica

#### Canvas API (Recomendado para Performance)
```
┌─────────────────────────────────────────────┐
│  <canvas> (full viewport, position: fixed)   │
│                                               │
│    ░  ·     ◆          ·    ░                │
│        ·  ░     ·   ◆       ·               │
│  ◆      ·     ░        ·   ░                │
│     ·  ░   ◆     ·  ░                       │
│  ░       ·    ░     ◆   ·    ░              │
│                                               │
│  ◆ = Bloco    ░ = Orb XP    · = Estrela     │
└─────────────────────────────────────────────┘
```

- Canvas posicionado com `position: fixed; inset: 0; z-index: 0`
- Todo o conteúdo do site fica acima (`z-index: 1+`)
- `pointer-events: none` no canvas (não interfere nos cliques)
- Usar `requestAnimationFrame` para o loop de animação
- Target: 60fps em desktop, 30fps em mobile (throttle)

#### Classe de Partícula (Pseudo-código)
```typescript
interface Particle {
  x: number;           // Posição X
  y: number;           // Posição Y
  size: number;        // Tamanho (2-12px)
  speed: number;       // Velocidade de subida (0.2-1.0)
  opacity: number;     // Opacidade (0.1-0.4)
  type: 'block' | 'orb' | 'star' | 'dust';
  color: string;       // Cor da partícula
  rotation: number;    // Rotação atual (blocos)
  rotationSpeed: number; // Velocidade de rotação
  oscillation: {
    amplitude: number; // 20-50px
    frequency: number; // 0.01-0.03
    offset: number;    // Offset aleatório
  };
  layer: 1 | 2 | 3;   // Camada de parallax
  pulse?: {            // Apenas para orbs
    min: number;       // 0.8
    max: number;       // 1.2
    speed: number;
  };
}
```

### RN-BG-05: Performance

| Regra | Detalhes |
|-------|----------|
| **Max de partículas** | 60 (desktop), 25 (mobile) |
| **FPS target** | 60fps (desktop), 30fps (mobile) |
| **Detecção de low-end** | Se FPS < 30 por 5s seguidos: reduzir partículas para 50% |
| **Reduzir em background** | Se tab não está ativa (`document.hidden`): pausar animação |
| **Preferência de movimento** | Respeitar `prefers-reduced-motion`: desabilitar animações se ativo |
| **Canvas resize** | Debounce de 200ms ao redimensionar janela |
| **Memory** | Reutilizar partículas (object pool) em vez de criar/destruir |

### RN-BG-06: Paleta de Cores das Partículas

| Tipo | Cores |
|------|-------|
| **Blocos** | `#4CAF50` (verde), `#8B6914` (marrom), `#6D6D6D` (cinza pedra) |
| **Orbs de XP** | `#81C784` → `#FFD700` (gradiente verde ao dourado, com glow) |
| **Estrelas** | `#FFFFFF` (branco puro, opacidade variável) |
| **Poeira** | `#A0A0A0` (cinza claro, muito transparente) |

### RN-BG-07: Tela de Fundo Estática (Fallback)
- Se JavaScript desabilitado ou `prefers-reduced-motion: reduce`:
  - Exibir apenas o background sólido `#1A1A2E`
  - Opcionalmente: gradiente sutil CSS-only (sem JS)
  ```css
  background: linear-gradient(180deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%);
  ```

---

## Wireframe Visual

```
VIEWPORT (posição fixa, atrás de tudo)
┌──────────────────────────────────────────┐
│                                          │ ← z-index: 0
│    ■        ·                ·           │
│         ·        ●                  ■    │  ■ = Bloco (verde/marrom)
│  ·                    ·                  │  ● = Orb XP (verde+glow)
│              ■              ·     ●      │  · = Estrela/Brilho
│    ·                   ■                 │
│         ●        ·              ·        │
│  ·          ·          ·    ■            │
│       ■           ●              ·       │
│              ·                ■          │
│    ·     ■        ·       ·         ●    │
│                                          │
│  [Conteúdo do site fica ACIMA disto]     │ ← z-index: 1+
└──────────────────────────────────────────┘
```

---

## Acessibilidade

| Requisito | Implementação |
|-----------|---------------|
| `prefers-reduced-motion` | Desabilitar todas as animações |
| `aria-hidden="true"` | Canvas é decorativo, não semântico |
| `pointer-events: none` | Não interfere com interação do usuário |
| **Contraste** | Partículas de baixa opacidade não afetam leitura do texto |
| **Sem informação crítica** | O background é 100% decorativo |

---

## Integração no Layout

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AnimatedBackground />  {/* z-index: 0, fixed */}
        <Navbar />              {/* z-index: 50, fixed */}
        <main>{children}</main> {/* z-index: 1, relative */}
        <Footer />              {/* z-index: 1, relative */}
      </body>
    </html>
  );
}
```
