"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Loader2, MessageSquare, MessagesSquare, ThumbsUp, Award, Ban, ShieldCheck, Clock } from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import {
  api,
  ApiError,
  EmptyState,
  inputClass,
  primaryButtonClass,
  RoleBadge,
  secondaryButtonClass,
  TopicRow,
  When,
  type TopicSummary,
} from "@/components/comunidade/shared";
import { BAN_MAX_DAYS, BAN_REASON_MAX } from "@/lib/forum/ban";

interface Member {
  id: string;
  username: string;
  uuid: string | null;
  skin: { id: string; source: "java" | "bedrock" | "nick" } | null;
  role: string;
  rank: { group: string; label: string; color: string } | null;
  seniority: { label: string; since: string };
  joinedAt: string;
  bio: string | null;
  reputation: number;
  badge: string;
  postCount: number;
  commentCount: number;
  likesReceived: number;
  banned: boolean;
  ban: { until: string; permanent: boolean; reason: string | null } | null;
  canBan: boolean;
}

interface MemberResponse {
  member: Member;
  topics: TopicSummary[];
  comments: { id: string; excerpt: string; createdAt: string; post: { title: string; href: string } }[];
}

export function MembroContent({ nick }: { nick: string }) {
  const { data: session } = useSession();
  const [data, setData] = useState<MemberResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [banOpen, setBanOpen] = useState(false);
  const [banDays, setBanDays] = useState("7");
  const [banReason, setBanReason] = useState("");
  const [banBusy, setBanBusy] = useState(false);
  const [banError, setBanError] = useState<{ error: string; code?: string } | null>(null);

  async function load() {
    const res = await api<MemberResponse>(`/api/forum/membros/${encodeURIComponent(nick)}`);
    if (res.ok) setData(res.data);
    else setNotFound(true);
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;
    api<MemberResponse>(`/api/forum/membros/${encodeURIComponent(nick)}`).then((res) => {
      if (cancelled) return;
      if (res.ok) setData(res.data);
      else setNotFound(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [nick]);

  async function applyBan(e: React.FormEvent) {
    e.preventDefault();
    if (!data || banBusy) return;
    setBanBusy(true);
    setBanError(null);
    const res = await api<{ success: true }>("/api/forum/banimentos", {
      method: "POST",
      body: JSON.stringify({
        userId: data.member.id,
        dias: banDays === "permanente" ? null : Number(banDays),
        motivo: banReason.trim(),
      }),
    });
    setBanBusy(false);
    if (!res.ok) {
      setBanError({ error: res.error, code: res.code });
      return;
    }
    setBanOpen(false);
    setBanReason("");
    await load();
  }

  async function liftBan() {
    if (!data || banBusy || !window.confirm("Encerrar a suspensão deste membro?")) return;
    setBanBusy(true);
    const res = await api<{ success: true }>("/api/forum/banimentos", {
      method: "DELETE",
      body: JSON.stringify({ userId: data.member.id }),
    });
    setBanBusy(false);
    if (!res.ok) {
      setBanError({ error: res.error, code: res.code });
      return;
    }
    await load();
  }

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Comunidade", href: "/comunidade" },
    { label: data?.member.username ?? nick },
  ];

  if (loading) {
    return (
      <>
        <PageHero title="MEMBRO" breadcrumbs={breadcrumbs} />
        <div className="flex justify-center py-20">
          <Loader2 size={32} className="animate-spin text-green-cs" />
        </div>
      </>
    );
  }

  if (notFound || !data) {
    return (
      <>
        <PageHero title="MEMBRO" breadcrumbs={breadcrumbs} />
        <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
          <EmptyState title="Membro não encontrado" description="Esse nick não tem conta no site." />
          <div className="text-center">
            <Link href="/comunidade" className={secondaryButtonClass}>
              Voltar para a comunidade
            </Link>
          </div>
        </div>
      </>
    );
  }

  const { member, topics, comments } = data;
  const avatarUrl = `https://mc-heads.net/avatar/${encodeURIComponent(member.skin?.id ?? member.username)}/100`;
  const isSelf = session?.user?.id === member.id;
  const formatMonth = (date: string) => new Date(date).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

  const stats = [
    { icon: Award, label: "Reputação", value: `${member.reputation} pts`, sub: member.badge, cor: "#FFD700" },
    { icon: MessageSquare, label: "Posts", value: String(member.postCount), cor: "#9C27B0" },
    { icon: MessagesSquare, label: "Comentários", value: String(member.commentCount), cor: "#FF9800" },
    { icon: ThumbsUp, label: "Curtidas recebidas", value: String(member.likesReceived), cor: "#4CAF50" },
  ];

  return (
    <>
      <PageHero title={member.username.toUpperCase()} breadcrumbs={breadcrumbs} />

      <div className="mx-auto max-w-7xl px-4 pb-16 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-bg-card/50 p-6 sm:flex-row sm:items-start"
        >
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border-2 border-white/20 bg-bg-accent">
            {/* eslint-disable-next-line @next/next/no-img-element -- avatar externo (mc-heads.net) */}
            <img src={avatarUrl} alt={member.username} className="h-full w-full object-cover" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-xl font-bold text-white">{member.username}</h2>
              {member.rank && (
                <span
                  className="rounded border px-2 py-0.5 text-xs font-bold"
                  style={{ color: member.rank.color, backgroundColor: `${member.rank.color}26`, borderColor: `${member.rank.color}66` }}
                  title="Cargo no servidor"
                >
                  {member.rank.label}
                </span>
              )}
              <RoleBadge role={member.role} />
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-[#A0A0A0]" title="Tempo de servidor">
                {member.seniority.label}
              </span>
              {member.banned && (
                <span className="inline-flex items-center gap-1 rounded bg-error/20 px-2 py-0.5 text-xs font-bold text-error">
                  <Ban size={12} /> Suspenso do fórum
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-[#A0A0A0]">
              No servidor desde {formatMonth(member.seniority.since)} · no site desde {formatMonth(member.joinedAt)}
            </p>
            {member.bio && <p className="mt-3 text-sm text-[#E0E0E0]">{member.bio}</p>}

            {member.ban && (
              <p className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-xs text-[#E0E0E0]">
                Suspensão {member.ban.permanent ? "permanente" : <>até {new Date(member.ban.until).toLocaleDateString("pt-BR")}</>}
                {member.ban.reason && <> · Motivo: {member.ban.reason}</>}
              </p>
            )}

            {(member.canBan || isSelf) && (
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                {isSelf && (
                  <Link href="/perfil" className={secondaryButtonClass}>
                    Meu perfil
                  </Link>
                )}
                {member.canBan && !member.banned && (
                  <button type="button" onClick={() => setBanOpen((v) => !v)} className={secondaryButtonClass}>
                    <ShieldCheck size={14} /> Suspender do fórum
                  </button>
                )}
                {member.canBan && member.banned && (
                  <button type="button" onClick={liftBan} disabled={banBusy} className={secondaryButtonClass}>
                    <ShieldCheck size={14} /> Encerrar suspensão
                  </button>
                )}
              </div>
            )}

            {banOpen && member.canBan && !member.banned && (
              <form onSubmit={applyBan} className="mt-4 space-y-3 rounded-xl border border-white/10 bg-bg-primary/60 p-4 text-left">
                <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
                  <div>
                    <label htmlFor="ban-dias" className="mb-1 block text-xs font-medium text-[#A0A0A0]">
                      Duração
                    </label>
                    <select id="ban-dias" value={banDays} onChange={(e) => setBanDays(e.target.value)} className={inputClass}>
                      {[1, 3, 7, 15, 30, 90, BAN_MAX_DAYS].map((d) => (
                        <option key={d} value={d} className="bg-bg-primary">
                          {d} {d === 1 ? "dia" : "dias"}
                        </option>
                      ))}
                      <option value="permanente" className="bg-bg-primary">
                        Permanente
                      </option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="ban-motivo" className="mb-1 block text-xs font-medium text-[#A0A0A0]">
                      Motivo (o membro vê esta mensagem)
                    </label>
                    <input
                      id="ban-motivo"
                      type="text"
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                      maxLength={BAN_REASON_MAX}
                      className={inputClass}
                      required
                    />
                  </div>
                </div>
                {banError && <ApiError error={banError.error} code={banError.code} />}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setBanOpen(false)} className={secondaryButtonClass}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={banBusy || !banReason.trim()} className={primaryButtonClass}>
                    {banBusy ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />} Confirmar suspensão
                  </button>
                </div>
              </form>
            )}
            {banError && !banOpen && <div className="mt-3"><ApiError error={banError.error} code={banError.code} /></div>}
          </div>
        </motion.div>

        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-white/10 bg-bg-card/50 p-4">
              <s.icon size={18} style={{ color: s.cor }} aria-hidden="true" />
              <p className="mt-2 text-lg font-bold text-white">{s.value}</p>
              <p className="text-xs text-[#A0A0A0]">
                {s.label}
                {"sub" in s && s.sub ? ` · ${s.sub}` : ""}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-label="Posts recentes">
            <h3 className="mb-3 text-lg font-bold text-white">Posts recentes</h3>
            {topics.length > 0 ? (
              <div className="space-y-2">
                {topics.map((t) => (
                  <TopicRow key={t.id} topic={t} showCategory />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#A0A0A0]">Nenhum post ainda.</p>
            )}
          </section>

          <section aria-label="Comentários recentes">
            <h3 className="mb-3 text-lg font-bold text-white">Comentários recentes</h3>
            {comments.length > 0 ? (
              <div className="space-y-2">
                {comments.map((c) => (
                  <Link
                    key={c.id}
                    href={c.post.href}
                    className="block rounded-xl border border-white/10 bg-bg-card/50 p-4 transition-all hover:border-white/20 hover:bg-bg-card/80"
                  >
                    <p className="text-sm text-[#E0E0E0]">{c.excerpt}</p>
                    <p className="mt-1.5 flex items-center gap-2 text-xs text-[#A0A0A0]">
                      <span className="truncate">em {c.post.title}</span>
                      <span className="flex shrink-0 items-center gap-1">
                        <Clock size={12} /> <When date={c.createdAt} />
                      </span>
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#A0A0A0]">Nenhum comentário ainda.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
