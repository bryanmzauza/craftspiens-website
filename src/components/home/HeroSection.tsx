"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useSession } from "next-auth/react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SERVER_IP } from "@/lib/constants";
import { HERO_IMAGE } from "@/components/home/hero-image";
import { HeroMotes } from "@/components/home/HeroMotes";

type ServerStatus = { online: boolean; players: number };

export function HeroSection() {
  const { data: session } = useSession();
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [copied, setCopied] = useState(false);

  // Parallax de rolagem: a imagem desce mais devagar que a página e o texto
  // sobe e some antes de a próxima seção chegar
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "18%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "40%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  // Parallax do ponteiro: a imagem e o texto se deslocam em sentidos opostos,
  // poucos pixels, só em telas com mouse
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 40, damping: 18, mass: 0.6 });
  const springY = useSpring(pointerY, { stiffness: 40, damping: 18, mass: 0.6 });
  const imageShiftX = useTransform(springX, [-0.5, 0.5], [16, -16]);
  const imageShiftY = useTransform(springY, [-0.5, 0.5], [10, -10]);
  const contentShiftX = useTransform(springX, [-0.5, 0.5], [-8, 8]);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
      pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
    };
    const onLeave = () => {
      pointerX.set(0);
      pointerY.set(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [reduceMotion, pointerX, pointerY]);

  useEffect(() => {
    let active = true;
    fetch("/api/server-status")
      .then((res) => res.json())
      .then((data) => {
        if (active) setStatus({ online: !!data.online, players: data.players?.online ?? 0 });
      })
      .catch(() => {
        if (active) setStatus({ online: false, players: 0 });
      });
    return () => {
      active = false;
    };
  }, []);

  const copyIp = async () => {
    try {
      await navigator.clipboard.writeText(SERVER_IP);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o IP continua visível no botão
    }
  };

  return (
    <section ref={sectionRef} className="relative isolate min-h-[100svh] overflow-hidden">
      {/* Imagem de fundo: parallax de rolagem (externo), do ponteiro (meio) e zoom lento (interno) */}
      <motion.div
        style={{ y: imageY }}
        className="absolute inset-0 stacked:bottom-auto stacked:h-[56svh]"
      >
        <motion.div style={{ x: imageShiftX, y: imageShiftY }} className="absolute -inset-5">
          <div className={`absolute inset-0 ${reduceMotion ? "" : "hero-kenburns"}`}>
            <Image
              src={HERO_IMAGE}
              alt="Campus virtual da CraftSapiens no Minecraft: alunos e professor ao redor de um holograma do sistema solar"
              fill
              priority
              sizes="100vw"
              quality={80}
              placeholder="blur"
              className="object-cover object-[62%_50%] stacked:object-[66%_50%] lg:object-[60%_50%]"
            />
          </div>
        </motion.div>
      </motion.div>

      {/* Luz e poeira */}
      <div
        aria-hidden="true"
        className="hero-glow pointer-events-none absolute -left-[12vw] -top-[22vh] h-[70vh] w-[70vh] rounded-full stacked:-top-[14vh] stacked:h-[44vh] stacked:w-[44vh] bg-[radial-gradient(circle,rgba(255,226,170,0.42),rgba(255,226,170,0)_62%)] mix-blend-screen"
      />
      <HeroMotes />

      {/* Escurecimento para o texto e transições para a navbar e para a próxima seção */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-bg-primary/75 to-transparent"
      />
      {/* Telas em pé: a imagem se funde com o fundo escuro, e o texto fica abaixo dela */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[30svh] hidden h-[26svh] bg-linear-to-t from-bg-primary via-bg-primary/80 to-transparent stacked:block"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[56svh] bottom-0 hidden bg-bg-primary stacked:block"
      />
      {/* Telas largas: escurecimento à esquerda, atrás do texto, e transição para a próxima seção */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-bg-primary/90 via-bg-primary/55 to-bg-primary/10 stacked:hidden lg:via-bg-primary/40 lg:to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[55%] bg-linear-to-t from-bg-primary via-bg-primary/65 to-transparent stacked:hidden"
      />

      {/* Conteúdo */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity, x: contentShiftX }}
        className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col justify-center px-4 pb-32 pt-28 stacked:justify-start stacked:pb-16 stacked:pt-[44svh] lg:px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <p className="flex flex-wrap items-center gap-x-4 gap-y-2 font-[family-name:var(--font-jetbrains-mono)] text-[11px] uppercase tracking-[0.22em] text-green-light sm:text-xs">
            <span>O Maior Metaverso Educacional do Mundo</span>
            {status && (
              <span className="flex items-center gap-2 text-[#E0E0E0]">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${
                    status.online ? "bg-green-cs shadow-[0_0_8px_#4CAF50]" : "bg-[#A0A0A0]"
                  }`}
                />
                {status.online
                  ? `${status.players} ${status.players === 1 ? "jogador" : "jogadores"} online`
                  : "Servidor offline"}
              </span>
            )}
          </p>

          <h1 className="mt-6 font-[family-name:var(--font-press-start)] text-[1.7rem] leading-[1.4] text-white sm:text-4xl sm:leading-[1.35] lg:text-[3.1rem] lg:leading-[1.3]">
            CONSTRUA SEU <span className="text-green-cs">FUTURO</span> JOGANDO.
          </h1>

          <p className="mt-7 max-w-xl text-base leading-relaxed text-[#E0E0E0] sm:text-lg">
            Aulas ao vivo dentro do servidor Minecraft, com professores, um campus virtual e
            recompensas por cada conquista. A mesma conta vale no site e no jogo.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            {session?.user ? (
              <Button href="/perfil" size="lg">
                Acessar meu perfil
              </Button>
            ) : (
              <Button href="/registro" size="lg">
                Criar conta grátis
              </Button>
            )}
            <Button href="/aulas" variant="secondary" size="lg">
              Conhecer as aulas
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-[#E0E0E0]">
            <span>IP do servidor</span>
            <button
              type="button"
              onClick={copyIp}
              className="group inline-flex items-center gap-2.5 rounded-md border border-white/15 bg-black/30 px-3 py-1.5 font-[family-name:var(--font-jetbrains-mono)] text-sm text-white backdrop-blur-sm transition-colors hover:border-green-cs/60"
            >
              {SERVER_IP}
              {copied ? (
                <Check size={14} className="text-green-cs" aria-hidden="true" />
              ) : (
                <Copy size={14} className="text-[#A0A0A0] transition-colors group-hover:text-white" aria-hidden="true" />
              )}
              <span className="sr-only">{copied ? "IP copiado" : "Copiar IP do servidor"}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* Indicador de rolagem */}
      <div className="absolute inset-x-0 bottom-7 z-10 flex justify-center stacked:hidden">
        <a
          href="#projeto"
          className="flex flex-col items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-white/55 transition-colors hover:text-white"
        >
          <span>Rolar</span>
          <span className="block h-10 w-px overflow-hidden bg-white/15">
            <span className="scroll-cue-bar block h-full w-full bg-white/80" />
          </span>
        </a>
      </div>
    </section>
  );
}
