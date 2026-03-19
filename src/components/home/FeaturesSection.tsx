"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Coins, GraduationCap } from "lucide-react";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Aulas Gamificadas",
    description:
      "Aprenda dentro do Minecraft com aulas interativas, missões educativas e professores em tempo real. Cada aula é uma aventura.",
  },
  {
    icon: Coins,
    title: "Moeda SAPIENS",
    description:
      "Ganhe moedas por participação, acertos e conquistas. Use para personalizar seu personagem e desbloquear conteúdos exclusivos.",
  },
  {
    icon: GraduationCap,
    title: "Enem & Reforço",
    description:
      "Preparação para provas e reforço escolar com método gamificado. Simulados interativos direto no servidor.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function FeaturesSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <motion.div key={feature.title} variants={cardVariants}>
              <Link
                href="/aulas"
                className="group block rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur transition-all duration-200 hover:border-green-cs hover:scale-[1.02] hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]"
              >
                <feature.icon className="h-10 w-10 text-green-cs" />
                <h3 className="mt-4 text-lg font-bold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#E0E0E0]">
                  {feature.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
