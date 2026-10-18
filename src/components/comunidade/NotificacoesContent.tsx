"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, Bell, CheckCheck, MessageSquare, ThumbsUp, AtSign, ShieldCheck, Flag, Settings } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { api, type Author, Avatar, EmptyState, Paginator, secondaryButtonClass, When, type Pagination } from "@/components/comunidade/shared";

type NotificationType = "REPLY_TOPIC" | "REPLY_COMMENT" | "LIKE_POST" | "LIKE_COMMENT" | "MENTION" | "MODERATION" | "REPORT";

interface Notification {
  id: string;
  type: NotificationType;
  message: string | null;
  readAt: string | null;
  createdAt: string;
  actor: Author | null;
  post: { title: string; href: string } | null;
}

interface NotificationsResponse {
  notifications: Notification[];
  unread: number;
  pagination: Pagination;
}

const ICONS: Record<NotificationType, { icon: typeof Bell; cor: string }> = {
  REPLY_TOPIC: { icon: MessageSquare, cor: "#4CAF50" },
  REPLY_COMMENT: { icon: MessageSquare, cor: "#4CAF50" },
  LIKE_POST: { icon: ThumbsUp, cor: "#2196F3" },
  LIKE_COMMENT: { icon: ThumbsUp, cor: "#2196F3" },
  MENTION: { icon: AtSign, cor: "#9C27B0" },
  MODERATION: { icon: ShieldCheck, cor: "#FFC107" },
  REPORT: { icon: Flag, cor: "#E53935" },
};

/** Texto da notificação, usado aqui e no sino da navbar */
export function describeNotification(n: Notification): string {
  const who = n.actor?.username ?? "Alguém";
  switch (n.type) {
    case "REPLY_TOPIC":
      return `${who} respondeu ao seu tópico`;
    case "REPLY_COMMENT":
      return `${who} respondeu ao seu comentário`;
    case "LIKE_POST":
      return `${who} curtiu seu tópico`;
    case "LIKE_COMMENT":
      return `${who} curtiu seu comentário`;
    case "MENTION":
      return `${who} mencionou você`;
    case "REPORT":
      return `${who} abriu uma denúncia`;
    case "MODERATION":
      return n.message ?? "Aviso da moderação";
  }
}

export function NotificationItem({ n, compact = false }: { n: Notification; compact?: boolean }) {
  const { icon: Icon, cor } = ICONS[n.type];
  const href = n.post?.href ?? (n.type === "REPORT" ? "/comunidade/moderacao" : "/comunidade");
  return (
    <Link
      href={href}
      className={`flex gap-3 rounded-xl border p-3 transition-all hover:border-white/20 ${
        n.readAt ? "border-white/10 bg-bg-card/30" : "border-green-cs/30 bg-green-cs/5"
      } ${compact ? "" : "sm:p-4"}`}
    >
      <div className="relative shrink-0">
        {n.actor ? <Avatar author={n.actor} size={compact ? 28 : 36} /> : <div className="h-9 w-9 rounded-md bg-white/10" />}
        <span className="absolute -bottom-1 -right-1 rounded-full bg-bg-primary p-0.5">
          <Icon size={12} style={{ color: cor }} aria-hidden="true" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${n.readAt ? "text-[#E0E0E0]" : "font-semibold text-white"}`}>{describeNotification(n)}</p>
        {n.post && <p className="truncate text-xs text-[#A0A0A0]">{n.post.title}</p>}
        {n.type === "MODERATION" && n.post && n.message && <p className="text-xs text-[#A0A0A0]">{n.message}</p>}
        <p className="mt-0.5 text-[11px] text-[#A0A0A0]">
          <When date={n.createdAt} />
        </p>
      </div>
      {!n.readAt && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-green-cs" aria-label="Não lida" />}
    </Link>
  );
}

export function NotificacoesContent() {
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async (p: number) => {
    const res = await api<NotificationsResponse>(`/api/forum/notificacoes?pagina=${p}`);
    if (res.ok) setData(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<NotificationsResponse>(`/api/forum/notificacoes?pagina=${page}`).then((res) => {
      if (cancelled) return;
      if (res.ok) setData(res.data);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [page]);

  // Ao abrir a página, o que estava por ler passa a lido (depois de mostrado como novo)
  useEffect(() => {
    if (!data || data.unread === 0) return;
    const ids = data.notifications.filter((n) => !n.readAt).map((n) => n.id);
    if (ids.length === 0) return;
    const timer = setTimeout(() => {
      api("/api/forum/notificacoes", { method: "PUT", body: JSON.stringify({ ids }) }).then(() => {
        window.dispatchEvent(new Event("forum:notificacoes"));
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [data]);

  async function markAll() {
    setMarking(true);
    await api("/api/forum/notificacoes", { method: "PUT", body: JSON.stringify({ todas: true }) });
    window.dispatchEvent(new Event("forum:notificacoes"));
    await load(page);
    setMarking(false);
  }

  return (
    <>
      <PageHero
        title="NOTIFICAÇÕES"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Comunidade", href: "/comunidade" }, { label: "Notificações" }]}
      />

      <div className="mx-auto max-w-3xl px-4 pb-16 lg:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-[#A0A0A0]">
            {data && data.unread > 0 ? `${data.unread} por ler` : "Tudo lido"}
          </p>
          <div className="flex gap-2">
            <Link href="/perfil/configuracoes" className={secondaryButtonClass}>
              <Settings size={14} /> Preferências
            </Link>
            <button type="button" onClick={markAll} disabled={marking || !data || data.unread === 0} className={secondaryButtonClass}>
              <CheckCheck size={14} /> Marcar todas como lidas
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin text-green-cs" />
          </div>
        ) : !data || data.notifications.length === 0 ? (
          <EmptyState title="Nenhuma notificação" description="Você será avisado quando responderem ou curtirem suas publicações." />
        ) : (
          <>
            <div className="space-y-2">
              {data.notifications.map((n, i) => (
                <motion.div key={n.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 10) * 0.02 }}>
                  <NotificationItem n={n} />
                </motion.div>
              ))}
            </div>
            <Paginator page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
