"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Users, BookOpen, GraduationCap, Loader2 } from "lucide-react";

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
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

// null = carregando; string = texto fixo (ex.: "Offline" ou "—")
type StatValue = number | string | null;

export function StatsSection() {
  const [jogadoresOnline, setJogadoresOnline] = useState<StatValue>(null);
  const [alunos, setAlunos] = useState<StatValue>(null);
  const [aulas, setAulas] = useState<StatValue>(null);

  useEffect(() => {
    async function fetchServerStatus() {
      try {
        const res = await fetch("/api/server-status");
        const data = await res.json();
        setJogadoresOnline(data.online ? data.players?.online ?? 0 : "Offline");
      } catch {
        setJogadoresOnline("Offline");
      }
    }

    async function fetchEstatisticas() {
      try {
        const res = await fetch("/api/estatisticas");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setAlunos(data.alunos);
        setAulas(data.aulas);
      } catch {
        setAlunos("—");
        setAulas("—");
      }
    }

    fetchServerStatus();
    fetchEstatisticas();
  }, []);

  const stats = [
    { icon: Users, label: "Jogadores Online", value: jogadoresOnline },
    { icon: GraduationCap, label: "Total de Alunos", value: alunos },
    { icon: BookOpen, label: "Aulas Disponíveis", value: aulas },
  ];

  return (
    <section className="py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-4xl px-4 lg:px-6"
      >
        <div className="grid grid-cols-1 gap-6 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-2 text-center">
              <stat.icon className="h-8 w-8 text-green-cs" />
              <span className="flex h-9 items-center text-3xl font-bold text-white">
                {stat.value === null ? (
                  <Loader2 className="h-6 w-6 animate-spin text-[#A0A0A0]" />
                ) : typeof stat.value === "number" ? (
                  <AnimatedCounter target={stat.value} />
                ) : (
                  stat.value
                )}
              </span>
              <span className="text-sm text-[#E0E0E0]">{stat.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
