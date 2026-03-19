"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  return (
    <section className="relative flex min-h-screen items-center pt-16">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:items-center lg:px-6">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-[family-name:var(--font-press-start)] text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
            CONSTRUA SEU{" "}
            <span className="text-green-cs">FUTURO</span>{" "}
            JOGANDO.
          </h1>
          <p className="mt-6 text-xl font-semibold text-green-light">
            O Maior Metaverso Educacional do Mundo.
          </p>
          <p className="mt-3 text-lg text-[#E0E0E0]">
            Aulas reais, gamificação e comunidade no Minecraft.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button href="/registro">Iniciar Jornada Grátis</Button>
            <Button href="/cronograma" variant="secondary">
              Ver Grade Curricular
            </Button>
          </div>
        </motion.div>

        {/* Visual placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden lg:flex items-center justify-center"
        >
          <div className="relative h-80 w-full overflow-hidden rounded-2xl border border-white/10 bg-bg-card/50 backdrop-blur">
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="text-6xl">🏗️</div>
              <p className="font-[family-name:var(--font-press-start)] text-sm text-green-cs">
                CRAFTSAPIENS
              </p>
              <p className="text-sm text-[#E0E0E0]">
                Metaverso Educacional
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
