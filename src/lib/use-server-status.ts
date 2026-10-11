"use client";

import { useSyncExternalStore } from "react";

// Status do servidor compartilhado entre os componentes da página: uma única
// consulta a /api/server-status, repetida a cada 30 s enquanto houver algum
// componente usando e a aba estiver visível.

export interface ServerStatus {
  online: boolean;
  players: { online: number; max: number; sample: string[] };
  version: string;
  motd: string;
  latency: number | null;
  checkedAt: string;
}

const REFRESH_MS = 30_000;

let current: ServerStatus | null = null;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

const OFFLINE: Omit<ServerStatus, "checkedAt"> = {
  online: false,
  players: { online: 0, max: 0, sample: [] },
  version: "",
  motd: "",
  latency: null,
};

async function refresh() {
  if (typeof document !== "undefined" && document.hidden) return;
  try {
    const res = await fetch("/api/server-status", { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    current = await res.json();
  } catch {
    current = { ...OFFLINE, checkedAt: new Date().toISOString() };
  }
  listeners.forEach((listener) => listener());
}

function onVisibility() {
  if (!document.hidden) refresh();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    refresh();
    timer = setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", onVisibility);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    }
  };
}

/** null enquanto a primeira consulta não termina */
export function useServerStatus(): ServerStatus | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null
  );
}
