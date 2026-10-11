"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { getDisciplineIcon } from "@/lib/discipline-icons";

interface Discipline {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  icon: string;
  color: string;
  area: string;
  lessonsCount: number;
}

const MAX_ITEMS = 8;

/** Fundo translúcido a partir da cor da disciplina (hex de 6 dígitos) */
function tint(color: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}1f` : "rgba(255,255,255,0.06)";
}

export function DisciplinesSection() {
  // null = carregando; [] = sem disciplinas (a seção não aparece)
  const [disciplines, setDisciplines] = useState<Discipline[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/aulas")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
      .then((data) => {
        if (active) setDisciplines(data.disciplines ?? []);
      })
      .catch(() => {
        if (active) setDisciplines([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (disciplines && disciplines.length === 0) return null;

  const items = disciplines?.slice(0, MAX_ITEMS);

  return (
    <section id="disciplinas" className="scroll-mt-16 border-t border-white/[0.06] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.22em] text-green-cs">
              Disciplinas
            </p>
            <h2 className="mt-5 font-[family-name:var(--font-press-start)] text-xl leading-[1.5] text-white sm:text-2xl sm:leading-[1.45]">
              O que você vai estudar
            </h2>
          </div>
          <Link
            href="/aulas"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-green-cs transition-colors hover:text-green-light"
          >
            Ver todas as disciplinas
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items
            ? items.map((discipline, i) => {
                const Icon = getDisciplineIcon(discipline.icon);
                return (
                  <motion.div
                    key={discipline.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.45, delay: (i % 4) * 0.07 }}
                  >
                    <Link
                      href={`/aulas/${discipline.slug}`}
                      className="group flex h-full flex-col rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/25 hover:bg-white/[0.06]"
                    >
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-lg"
                        style={{ backgroundColor: tint(discipline.color), color: discipline.color }}
                      >
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <h3 className="mt-5 text-lg font-bold text-white">{discipline.name}</h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#E0E0E0]">
                        {discipline.shortDescription}
                      </p>
                      <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-xs text-[#A0A0A0]">
                        <span className="font-[family-name:var(--font-jetbrains-mono)]">
                          {discipline.lessonsCount} {discipline.lessonsCount === 1 ? "aula" : "aulas"}
                        </span>
                        <span className="truncate">{discipline.area}</span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            : Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  className="h-56 animate-pulse rounded-xl border border-white/5 bg-white/[0.03]"
                />
              ))}
        </div>
      </div>
    </section>
  );
}
