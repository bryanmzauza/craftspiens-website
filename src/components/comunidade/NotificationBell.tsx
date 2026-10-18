"use client";

// Sino da navbar: número de notificações por ler e as últimas, com atualização
// periódica. Some quando o fórum responde 403 (seção ainda restrita) ou sem login.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { api, type Author } from "@/components/comunidade/shared";
import { NotificationItem } from "@/components/comunidade/NotificacoesContent";

const POLL_MS = 60_000;

interface Notification {
  id: string;
  type: "REPLY_TOPIC" | "REPLY_COMMENT" | "LIKE_POST" | "LIKE_COMMENT" | "MENTION" | "MODERATION" | "REPORT";
  message: string | null;
  readAt: string | null;
  createdAt: string;
  actor: Author | null;
  post: { title: string; href: string } | null;
}

export function NotificationBell({ className = "" }: { className?: string }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [unread, setUnread] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[] | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fórum ainda restrito (403) para esta conta: para de consultar até a próxima sessão
  const blockedRef = useRef(false);

  const refreshCount = useCallback(() => {
    if (blockedRef.current) return Promise.resolve();
    return api<{ unread: number }>("/api/forum/notificacoes/contagem").then((res) => {
      if (!res.ok && res.status === 403) blockedRef.current = true;
      setUnread(res.ok ? res.data.unread : null);
    });
  }, []);

  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) return;
    blockedRef.current = false;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refreshCount();
    }, POLL_MS);
    const initial = setTimeout(refreshCount, 0);
    window.addEventListener("forum:notificacoes", refreshCount);
    return () => {
      clearInterval(timer);
      clearTimeout(initial);
      window.removeEventListener("forum:notificacoes", refreshCount);
    };
  }, [userId, refreshCount]);

  // Fecha ao navegar e ao clicar fora
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (!next) return;
    setLoadingItems(true);
    const res = await api<{ notifications: Notification[]; unread: number }>("/api/forum/notificacoes?pagina=1");
    if (res.ok) {
      setItems(res.data.notifications.slice(0, 6));
      setUnread(res.data.unread);
      const ids = res.data.notifications.filter((n) => !n.readAt).map((n) => n.id);
      if (ids.length > 0) {
        api<{ unread: number }>("/api/forum/notificacoes", { method: "PUT", body: JSON.stringify({ ids }) }).then((r) => {
          if (r.ok) setUnread(r.data.unread);
        });
      }
    }
    setLoadingItems(false);
  }

  if (!session?.user || unread === null) return null;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `${unread} notificações por ler` : "Notificações"}
        aria-expanded={open}
        className="relative rounded-lg p-2 text-white transition-colors hover:bg-white/10"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-cs px-1 text-[10px] font-bold text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 bg-bg-card/95 p-2 shadow-xl backdrop-blur">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm font-bold text-white">Notificações</span>
            <Link href="/comunidade/notificacoes" className="text-xs text-green-cs hover:underline">
              Ver todas
            </Link>
          </div>
          {loadingItems ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-green-cs" />
            </div>
          ) : items && items.length > 0 ? (
            <div className="max-h-96 space-y-1.5 overflow-y-auto p-1">
              {items.map((n) => (
                <NotificationItem key={n.id} n={n} compact />
              ))}
            </div>
          ) : (
            <p className="px-2 py-6 text-center text-xs text-[#A0A0A0]">Nenhuma notificação por enquanto.</p>
          )}
        </div>
      )}
    </div>
  );
}
