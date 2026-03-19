"use client";

import { motion } from "framer-motion";
import { UserPlus, Gamepad2, BookOpenCheck, Trophy } from "lucide-react";
import { SERVER_IP } from "@/lib/constants";

const STEPS = [
  {
    icon: UserPlus,
    number: "01",
    title: "Crie sua conta",
    description: "Registre-se gratuitamente no site com seu nick do Minecraft.",
  },
  {
    icon: Gamepad2,
    number: "02",
    title: "Entre no servidor",
    description: `Conecte-se pelo IP ${SERVER_IP} e explore o campus virtual.`,
  },
  {
    icon: BookOpenCheck,
    number: "03",
    title: "Assista aulas jogando",
    description:
      "Participe de aulas ao vivo dentro do Minecraft com nossos professores.",
  },
  {
    icon: Trophy,
    number: "04",
    title: "Conquiste recompensas",
    description:
      "Ganhe Moedas SAPIENS, XP e conquistas por sua participação e desempenho.",
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function HowItWorksSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center font-[family-name:var(--font-press-start)] text-2xl text-white sm:text-3xl"
        >
          COMO FUNCIONA
        </motion.h2>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map((step) => (
            <motion.div
              key={step.number}
              variants={itemVariants}
              className="text-center"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-cs/10 border border-green-cs/20">
                <step.icon className="h-8 w-8 text-green-cs" />
              </div>
              <span className="mt-4 block font-[family-name:var(--font-press-start)] text-xs text-green-cs">
                {step.number}
              </span>
              <h3 className="mt-2 text-lg font-bold text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-[#E0E0E0]">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
