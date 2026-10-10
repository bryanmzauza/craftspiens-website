"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import moedaSapiens from "@/assets/brand/moeda-sapiens.webp";
import type { StaticImageData } from "next/image";

interface Pillar {
  title: string;
  description: string;
  href: string;
  image?: StaticImageData;
  imageAlt?: string;
}

const PILLARS: Pillar[] = [
  {
    title: "Aulas dentro do jogo",
    description:
      "As aulas acontecem ao vivo no servidor, com professores conduzindo a turma em um campus construído bloco a bloco. O conteúdo segue o currículo escolar.",
    href: "/aulas",
  },
  {
    title: "Moeda SAPIENS e progressão",
    description:
      "Participação, acertos e missões concluídas rendem moedas e XP. O aluno acompanha o próprio progresso por disciplina e desbloqueia conteúdos conforme avança.",
    href: "/aulas",
    image: moedaSapiens,
    imageAlt: "Moeda SAPIENS, com o rosto de Einstein",
  },
  {
    title: "Enem e reforço escolar",
    description:
      "Trilhas de preparação para provas e revisão de conteúdo, no mesmo ambiente das aulas regulares e com o mesmo método.",
    href: "/aulas",
  },
];

export function IntroSection() {
  return (
    <section id="projeto" className="scroll-mt-16 py-24 lg:py-32">
      <div className="mx-auto grid max-w-7xl gap-14 px-4 lg:grid-cols-[5fr_7fr] lg:gap-24 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="lg:sticky lg:top-32 lg:self-start"
        >
          <p className="font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.22em] text-green-cs">
            O projeto
          </p>
          <h2 className="mt-5 font-[family-name:var(--font-press-start)] text-xl leading-[1.5] text-white sm:text-2xl sm:leading-[1.45]">
            Um servidor de Minecraft onde a aula acontece dentro do jogo.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-[#E0E0E0] sm:text-lg">
            A CraftSapiens reúne professores, um campus virtual e um sistema de recompensas.
            O aluno entra no servidor, participa das aulas e avança no conteúdo jogando.
          </p>
          <Link
            href="/sobre"
            className="group mt-8 inline-flex items-center gap-2 text-sm font-semibold text-green-cs transition-colors hover:text-green-light"
          >
            Conhecer a CraftSapiens
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </motion.div>

        <ul className="divide-y divide-white/10 border-y border-white/10">
          {PILLARS.map((pillar, i) => (
            <motion.li
              key={pillar.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Link
                href={pillar.href}
                className="group grid gap-4 py-8 sm:grid-cols-[3.5rem_1fr_auto] sm:gap-6 lg:py-10"
              >
                <span className="font-[family-name:var(--font-jetbrains-mono)] text-sm text-[#A0A0A0] transition-colors group-hover:text-green-cs">
                  0{i + 1}
                </span>
                {pillar.image && (
                  <Image
                    src={pillar.image}
                    alt={pillar.imageAlt ?? ""}
                    width={72}
                    height={72}
                    className="order-last h-16 w-16 self-start drop-shadow-[0_6px_16px_rgba(0,0,0,0.45)] transition-transform group-hover:rotate-6 sm:h-[72px] sm:w-[72px]"
                  />
                )}
                <div>
                  <h3 className="flex items-center gap-3 text-lg font-bold text-white sm:text-xl">
                    {pillar.title}
                    <ArrowRight
                      size={18}
                      className="-translate-x-1 text-green-cs opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                      aria-hidden="true"
                    />
                  </h3>
                  <p className="mt-3 max-w-prose text-sm leading-relaxed text-[#E0E0E0] sm:text-base">
                    {pillar.description}
                  </p>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
