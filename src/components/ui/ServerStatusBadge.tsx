"use client";

import Link from "next/link";
import { useServerStatus } from "@/lib/use-server-status";

interface ServerStatusBadgeProps {
  className?: string;
}

/** Indicador compacto do servidor: ponto de status + jogadores online, com link para /status */
export function ServerStatusBadge({ className = "" }: ServerStatusBadgeProps) {
  const status = useServerStatus();

  const label =
    status === null
      ? "Verificando servidor"
      : status.online
        ? `${status.players.online} online`
        : "Servidor offline";

  return (
    <Link
      href="/status"
      title={status?.online ? `${status.players.online} de ${status.players.max} jogadores online` : undefined}
      className={`inline-flex items-center gap-2 font-[family-name:var(--font-jetbrains-mono)] text-xs text-[#E0E0E0] transition-colors hover:text-white ${className}`}
    >
      <span aria-hidden="true" className="relative flex h-2 w-2">
        {status?.online && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-cs opacity-60 motion-reduce:animate-none" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            status === null ? "bg-white/30" : status.online ? "bg-green-cs" : "bg-[#A0A0A0]"
          }`}
        />
      </span>
      <span aria-live="polite">{label}</span>
    </Link>
  );
}
