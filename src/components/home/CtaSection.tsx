"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function CtaSection() {
  return (
    <section className="py-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl px-4 text-center lg:px-6"
      >
        <div className="rounded-2xl bg-gradient-to-br from-green-dark/30 to-bg-card/80 border border-green-cs/20 p-12 backdrop-blur">
          <h2 className="font-[family-name:var(--font-press-start)] text-2xl text-white sm:text-3xl">
            Pronto para construir seu futuro?
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-[#E0E0E0]">
            Junte-se a centenas de alunos que já estão aprendendo de forma
            divertida no maior metaverso educacional do mundo.
          </p>
          <div className="mt-8">
            <Button href="/registro">Criar Conta Grátis</Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
