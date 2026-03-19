"use client";

import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    name: "Pedro_M1ner",
    role: "Aluno — 8º ano",
    text: "Nunca pensei que ia gostar de estudar matemática, mas no CraftSapiens as aulas são tipo missões. Tirei as melhores notas da classe!",
    avatar: "⛏️",
  },
  {
    name: "Maria S.",
    role: "Mãe de aluno",
    text: "Meu filho pede pra estudar! A gamificação fez uma diferença enorme na motivação dele. Recomendo para todos os pais.",
    avatar: "👩",
  },
  {
    name: "CraftLord_22",
    role: "Aluno — 2º ano EM",
    text: "A preparação pra ENEM dentro do Minecraft é genial. Os simulados interativos me ajudaram demais. Já acumulei mais de 5000 Moedas SAPIENS!",
    avatar: "🎮",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function TestimonialsSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-[family-name:var(--font-press-start)] text-2xl text-white sm:text-3xl"
        >
          DEPOIMENTOS
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {TESTIMONIALS.map((t) => (
            <motion.blockquote
              key={t.name}
              variants={cardVariants}
              className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <p className="text-sm leading-relaxed text-[#E0E0E0] italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <footer className="mt-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-card text-lg">
                  {t.avatar}
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-xs text-green-cs">{t.role}</p>
                </div>
              </footer>
            </motion.blockquote>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
