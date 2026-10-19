"use client";

// Receita por dia em barras (uma série, na cor da marca). Passar o mouse ou o
// dedo sobre um dia mostra a data, a receita e o número de vendas; "Ver tabela"
// mostra os mesmos números em texto.

import { useEffect, useMemo, useRef, useState } from "react";
import { brl, brlShort } from "@/components/painel/ui";

interface Point {
  date: string;
  revenue: number;
  orders: number;
}

const HEIGHT = 240;
const PAD = { top: 12, right: 8, bottom: 26, left: 64 };
const BAR_COLOR = "#4CAF50";
const BAR_HOVER = "#81C784";

/** Escala "redonda" para o eixo: 4 linhas de grade em valores fáceis de ler */
function niceMax(value: number): number {
  if (value <= 0) return 100;
  const step = Math.pow(10, Math.floor(Math.log10(value)));
  for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (m * step >= value) return m * step;
  }
  return 10 * step;
}

/** Barra com os cantos de cima arredondados, presa à linha de base */
function barPath(x: number, y: number, w: number, h: number): string {
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

function dayLabel(date: string, long = false): string {
  const d = new Date(`${date}T12:00:00`);
  return long
    ? d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function RevenueChart({ data }: { data: Point[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(entry.contentRect.width, 280)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const max = useMemo(() => niceMax(Math.max(...data.map((d) => d.revenue), 0)), [data]);
  const innerW = width - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(data.length, 1);
  const gap = Math.max(2, Math.min(slot * 0.25, 6));
  const barW = Math.max(slot - gap, 1);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  // Rótulos do eixo x sem sobrepor: no máximo um a cada ~56px
  const labelEvery = Math.max(1, Math.ceil(56 / slot));
  const hovered = hover != null ? data[hover] : null;
  const total = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div>
      <div className="mb-2 flex items-center justify-end">
        <button onClick={() => setTable((t) => !t)} className="text-xs text-[#A0A0A0] underline-offset-2 hover:text-white hover:underline">
          {table ? "Ver gráfico" : "Ver tabela"}
        </button>
      </div>

      {table ? (
        <div className="max-h-[260px] overflow-y-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-bg-card text-left text-xs text-[#A0A0A0]">
              <tr>
                <th className="px-3 py-2 font-semibold">Dia</th>
                <th className="px-3 py-2 text-right font-semibold">Vendas</th>
                <th className="px-3 py-2 text-right font-semibold">Receita</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.date} className="border-t border-white/5">
                  <td className="px-3 py-1.5 text-[#C0C0C8]">{dayLabel(d.date, true)}</td>
                  <td className="px-3 py-1.5 text-right text-[#C0C0C8]">{d.orders}</td>
                  <td className="px-3 py-1.5 text-right font-medium text-white">{brl(d.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={wrapRef} className="relative" onMouseLeave={() => setHover(null)}>
          <svg width={width} height={HEIGHT} role="img" aria-label={`Receita por dia. Total do período: ${brl(total)}`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.07)" strokeDasharray={t === 0 ? undefined : "3 4"} />
                <text x={PAD.left - 10} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#7a7a90">
                  {brlShort(t)}
                </text>
              </g>
            ))}

            {data.map((d, i) => {
              const x = PAD.left + i * slot + gap / 2;
              const h = Math.max(((d.revenue / max) * innerH), 0);
              return (
                <g key={d.date}>
                  {h > 0 && <path d={barPath(x, y(d.revenue), barW, h)} fill={hover === i ? BAR_HOVER : BAR_COLOR} />}
                  {i % labelEvery === 0 && (
                    <text x={x + barW / 2} y={HEIGHT - 8} textAnchor="middle" fontSize="10.5" fill="#7a7a90">
                      {dayLabel(d.date)}
                    </text>
                  )}
                  {/* Área de toque maior que a barra: a coluna inteira do dia */}
                  <rect
                    x={PAD.left + i * slot}
                    y={PAD.top}
                    width={slot}
                    height={innerH}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onTouchStart={() => setHover(i)}
                  />
                </g>
              );
            })}
          </svg>

          {hovered && hover != null && (
            <div
              className="pointer-events-none absolute z-10 min-w-[150px] rounded-lg border border-white/15 bg-[#0f0f1f]/95 px-3 py-2 text-xs shadow-xl"
              style={{
                left: Math.min(Math.max(PAD.left + hover * slot + slot / 2 - 75, 0), width - 160),
                top: Math.max(y(hovered.revenue) - 70, 0),
              }}
            >
              <p className="font-semibold capitalize text-white">{dayLabel(hovered.date, true)}</p>
              <p className="mt-1 flex justify-between gap-4 text-[#A0A0A0]">
                Receita <span className="font-semibold text-white">{brl(hovered.revenue)}</span>
              </p>
              <p className="flex justify-between gap-4 text-[#A0A0A0]">
                Vendas <span className="font-semibold text-white">{hovered.orders}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Barra horizontal simples para listas (produtos, categorias, formas de pagamento) */
export function MeterRow({ label, value, max, detail, color = BAR_COLOR }: { label: string; value: number; max: number; detail: string; color?: string }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
        <span className="truncate text-[#E0E0E0]">{label}</span>
        <span className="shrink-0 text-xs text-[#A0A0A0]">{detail}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
