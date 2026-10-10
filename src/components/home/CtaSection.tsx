"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { HERO_IMAGE } from "@/components/home/hero-image";

export function CtaSection() {
  const { data: session } = useSession();

  return (
    <section className="relative isolate overflow-hidden border-t border-white/[0.06]">
      {/* A mesma imagem do hero, escurecida, fecha a página */}
      <Image
        src={HERO_IMAGE}
        alt=""
        fill
        sizes="100vw"
        quality={60}
        className="object-cover object-[60%_40%] scale-105 blur-[2px]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-bg-primary/85" />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-bg-primary to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-bg-primary to-transparent"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="relative z-10 mx-auto max-w-2xl px-4 py-28 text-center lg:px-6 lg:py-36"
      >
        <h2 className="font-[family-name:var(--font-press-start)] text-xl leading-[1.5] text-white sm:text-2xl sm:leading-[1.45]">
          Pronto para começar?
        </h2>
        <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-[#E0E0E0] sm:text-lg">
          Crie sua conta, entre no servidor e participe da próxima aula. O cadastro é gratuito.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {session?.user ? (
            <Button href="/cronograma" size="lg">
              Ver o cronograma
            </Button>
          ) : (
            <>
              <Button href="/registro" size="lg">
                Criar conta grátis
              </Button>
              <Button href="/cronograma" variant="secondary" size="lg">
                Ver o cronograma
              </Button>
            </>
          )}
        </div>
      </motion.div>
    </section>
  );
}
