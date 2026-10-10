"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

function AnimatedCounter({ target, duration = 1800 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString("pt-BR")}</span>;
}

// null = carregando; string = texto fixo (ex.: "Offline")
type StatValue = number | string | null;

export function StatsSection() {
  const [jogadoresOnline, setJogadoresOnline] = useState<StatValue>(null);
  const [serverOnline, setServerOnline] = useState(false);
  const [alunos, setAlunos] = useState<StatValue>(null);
  const [aulas, setAulas] = useState<StatValue>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/server-status")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setServerOnline(!!data.online);
        setJogadoresOnline(data.online ? data.players?.online ?? 0 : "Offline");
      })
      .catch(() => {
        if (active) setJogadoresOnline("Offline");
      });

    fetch("/api/estatisticas")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then((data) => {
        if (!active) return;
        setAlunos(data.alunos);
        setAulas(data.aulas);
      })
      .catch(() => {
        if (!active) return;
        setAlunos("—");
        setAulas("—");
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = [
    { label: "Jogadores online", value: jogadoresOnline, live: true },
    { label: "Alunos cadastrados", value: alunos, live: false },
    { label: "Aulas disponíveis", value: aulas, live: false },
  ];

  return (
    <section id="numeros" className="scroll-mt-16 border-t border-white/[0.06]">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto grid max-w-7xl px-4 sm:grid-cols-3 sm:divide-x sm:divide-white/[0.08] lg:px-6"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-baseline gap-4 border-b border-white/[0.08] py-8 last:border-b-0 sm:border-b-0 sm:px-8 sm:first:pl-0 sm:last:pr-0 lg:py-10"
          >
            <span className="min-w-[3ch] text-4xl font-bold tabular-nums text-white lg:text-5xl">
              {stat.value === null ? (
                <span className="inline-block h-8 w-16 animate-pulse rounded bg-white/10 align-middle lg:h-10" />
              ) : typeof stat.value === "number" ? (
                <AnimatedCounter target={stat.value} />
              ) : (
                <span className="text-2xl text-[#A0A0A0] lg:text-3xl">{stat.value}</span>
              )}
            </span>
            <span className="flex items-center gap-2 font-[family-name:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.2em] text-[#A0A0A0]">
              {stat.live && stat.value !== null && (
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    serverOnline ? "bg-green-cs shadow-[0_0_8px_#4CAF50]" : "bg-[#A0A0A0]"
                  }`}
                />
              )}
              {stat.label}
            </span>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
