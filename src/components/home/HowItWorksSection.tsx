"use client";

import { motion } from "framer-motion";
import { SERVER_IP } from "@/lib/constants";

const STEPS = [
  {
    number: "01",
    title: "Crie sua conta",
    description: "Cadastre-se no site com o seu nick do Minecraft. A conta é a mesma para o site e para o servidor.",
  },
  {
    number: "02",
    title: "Entre no servidor",
    description: `Conecte-se pelo IP ${SERVER_IP} e conheça o campus virtual.`,
  },
  {
    number: "03",
    title: "Participe das aulas",
    description: "Acompanhe o cronograma e entre nas aulas ao vivo, conduzidas pelos professores dentro do jogo.",
  },
  {
    number: "04",
    title: "Acompanhe o progresso",
    description: "Cada aula concluída rende Moedas SAPIENS e XP. O perfil mostra o avanço por disciplina.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="como-funciona" className="scroll-mt-16 border-t border-white/[0.06] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl"
        >
          <p className="font-[family-name:var(--font-jetbrains-mono)] text-xs uppercase tracking-[0.22em] text-green-cs">
            Como funciona
          </p>
          <h2 className="mt-5 font-[family-name:var(--font-press-start)] text-xl leading-[1.5] text-white sm:text-2xl sm:leading-[1.45]">
            Do cadastro à primeira aula em quatro passos
          </h2>
        </motion.div>

        <ol className="relative mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Linha que liga os passos: vertical no celular, horizontal no desktop */}
          <div
            aria-hidden="true"
            className="absolute left-5 top-0 h-full w-px bg-white/10 lg:left-0 lg:top-5 lg:h-px lg:w-full"
          />
          {STEPS.map((step, i) => (
            <motion.li
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative pl-16 lg:pl-0 lg:pt-16"
            >
              <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-md border border-white/15 bg-bg-primary font-[family-name:var(--font-jetbrains-mono)] text-xs text-green-cs">
                {step.number}
              </span>
              <h3 className="text-lg font-bold text-white">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#E0E0E0]">{step.description}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
