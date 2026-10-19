"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  CalendarDays,
  ExternalLink,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  TicketPercent,
  Truck,
} from "lucide-react";
import { ToastProvider } from "@/components/painel/ui";

const SECTIONS = [
  { href: "/painel", label: "Visão geral", icon: LayoutDashboard },
  { href: "/painel/vendas", label: "Vendas", icon: Receipt },
  { href: "/painel/produtos", label: "Produtos", icon: Package },
  { href: "/painel/cupons", label: "Cupons", icon: TicketPercent },
  { href: "/painel/entregas", label: "Entregas", icon: Truck },
  { href: "/painel/cronograma", label: "Cronograma", icon: CalendarDays },
  { href: "/painel/atividade", label: "Atividade", icon: History },
] as const;

export function PainelShell({ name, expiresAt, children }: { name: string; expiresAt: number; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  const isActive = (href: string) => (href === "/painel" ? pathname === href : pathname === href || pathname.startsWith(href + "/"));

  async function logout() {
    setLeaving(true);
    await fetch("/api/painel/acesso", { method: "DELETE" }).catch(() => null);
    router.refresh();
  }

  const until = new Date(expiresAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <ToastProvider>
      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-20 lg:px-6 lg:pt-24">
        {/* Navegação no celular: abas com rolagem */}
        <nav aria-label="Seções do painel" className="-mx-4 mb-6 overflow-x-auto px-4 lg:hidden">
          <div className="flex w-max gap-1 rounded-xl border border-white/10 bg-bg-card/60 p-1">
            {SECTIONS.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${
                  isActive(s.href) ? "bg-green-cs/15 text-green-light" : "text-[#A0A0A0]"
                }`}
              >
                <s.icon size={14} /> {s.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-4">
              <div className="rounded-2xl border border-white/10 bg-bg-card/60 p-4">
                <p className="font-[family-name:var(--font-press-start)] text-[11px] text-green-cs">PAINEL</p>
                <p className="mt-3 text-sm font-semibold text-white">Olá, {name}</p>
                <p className="mt-0.5 text-[11px] text-[#7a7a90]">Sessão até {until}</p>
              </div>

              <nav aria-label="Seções do painel" className="flex flex-col gap-0.5 rounded-2xl border border-white/10 bg-bg-card/60 p-2">
                {SECTIONS.map((s) => {
                  const active = isActive(s.href);
                  return (
                    <Link
                      key={s.href}
                      href={s.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active ? "bg-green-cs/15 text-green-light" : "text-[#C0C0C8] hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <s.icon size={17} className={active ? "text-green-cs" : "text-[#7a7a90]"} />
                      {s.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex flex-col gap-0.5 rounded-2xl border border-white/10 bg-bg-card/60 p-2">
                <Link href="/loja" target="_blank" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#A0A0A0] hover:bg-white/5 hover:text-white">
                  <ExternalLink size={15} /> Ver a loja
                </Link>
                <Link href="/cronograma" target="_blank" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#A0A0A0] hover:bg-white/5 hover:text-white">
                  <ExternalLink size={15} /> Ver o cronograma
                </Link>
                <button
                  onClick={logout}
                  disabled={leaving}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-[#ff8a87] hover:bg-error/10 disabled:opacity-50"
                >
                  <LogOut size={15} /> Sair do painel
                </button>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            {children}
            <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-4 text-[11px] text-[#7a7a90] lg:hidden">
              <span>
                {name} · sessão até {until}
              </span>
              <button onClick={logout} disabled={leaving} className="flex items-center gap-1 text-[#ff8a87]">
                <LogOut size={13} /> Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </ToastProvider>
  );
}
