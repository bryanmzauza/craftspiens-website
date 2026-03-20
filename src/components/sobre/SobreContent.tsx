"use client";

import { motion } from "framer-motion";
import {
  Target,
  Eye,
  Heart,
  Lightbulb,
  Users,
  ShieldCheck,
  Accessibility,
  Crown,
  Shield,
  UserCog,
  UserCheck,
  HelpCircle,
  GraduationCap,
  Newspaper,
  Youtube,
  Mic,
  Tv,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { Button } from "@/components/ui/Button";
import { SOCIAL_LINKS } from "@/lib/constants";

const TIMELINE = [
  { year: "2020", title: "Fundação", description: "Início do projeto CraftSapiens com as primeiras aulas gamificadas no Minecraft." },
  { year: "2021", title: "Reconhecimento", description: "Aparição na mídia e primeiras parcerias, crescendo a comunidade de alunos." },
  { year: "2022", title: "Expansão", description: "Novos professores, disciplinas e o lançamento do sistema de Moedas SAPIENS." },
  { year: "2026", title: "Novo Site", description: "Lançamento da nova plataforma web completa com loja, fórum e integração total." },
];

const VALUES = [
  { icon: Lightbulb, title: "Inovação Educacional", description: "Pioneiros no uso de Minecraft nativo para ensino gamificado." },
  { icon: Users, title: "Comunidade", description: "Aprendizado colaborativo com professores e alunos construindo juntos." },
  { icon: Heart, title: "Não Desistir", description: "Persistência diante de desafios, transformando dificuldades em aprendizado." },
  { icon: Accessibility, title: "Acessibilidade", description: "Versão gratuita disponível para que todos possam aprender." },
  { icon: ShieldCheck, title: "Segurança", description: "Ambiente monitorado e seguro para alunos de todas as idades." },
];

const TEAM = [
  { name: "Helton A. Gonçalves", role: "Diretor / Fundador", emoji: "👨‍💼" },
  { name: "Jonas Agra", role: "Minecraft Interessante", emoji: "🎮" },
  { name: "Thawana Oliveira", role: "Professora", emoji: "👩‍🏫" },
  { name: "Marcelo Camilli", role: "Professor", emoji: "👨‍🏫" },
  { name: "Erica", role: "Redes Sociais", emoji: "📱" },
  { name: "Wilton Andretti", role: "Professor", emoji: "👨‍🏫" },
  { name: "Arthur Martins", role: "Professor", emoji: "👨‍🏫" },
];

const MEDIA = [
  { name: "Jornal O Popular do Paraná", icon: Newspaper, type: "Impresso" },
  { name: "Willzy (1.2M+ inscritos)", icon: Youtube, type: "YouTube" },
  { name: "Futurium Podcast", icon: Mic, type: "Podcast" },
  { name: "Outras aparições na TV", icon: Tv, type: "Televisão" },
];

const HIERARCHY = [
  { icon: Crown, role: "Reitor", description: "Responsável por qualquer deliberação." },
  { icon: Shield, role: "Diretor", description: "Administração superior, deliberam em conselho." },
  { icon: UserCog, role: "Administradores", description: "Supervisionam e gerenciam conflitos." },
  { icon: UserCheck, role: "Moderadores", description: "Garantem o cumprimento das regras." },
  { icon: HelpCircle, role: "Ajuda", description: "Auxiliam novatos no servidor." },
  { icon: GraduationCap, role: "Professores", description: "Ministram as aulas gamificadas." },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export function SobreContent() {
  return (
    <>
      <PageHero
        title="SOBRE NÓS"
        subtitle="Conheça a CraftSapiens — O Maior Metaverso Educacional do Mundo."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Sobre" },
        ]}
      />

      {/* Nossa História — Timeline */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionTitle className="text-center">NOSSA HISTÓRIA</SectionTitle>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {TIMELINE.map((item) => (
              <motion.div
                key={item.year}
                variants={fadeIn}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur"
              >
                <span className="font-[family-name:var(--font-press-start)] text-lg text-green-cs">
                  {item.year}
                </span>
                <h3 className="mt-3 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-[#E0E0E0]">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.blockquote
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 rounded-xl border-l-4 border-green-cs bg-white/5 p-8 backdrop-blur"
          >
            <p className="text-lg italic text-[#E0E0E0]">
              &ldquo;Aqui os alunos realmente querem aprender, pois é prazeroso estudar jogando.&rdquo;
            </p>
            <footer className="mt-4 text-sm font-semibold text-green-cs">
              — Helton Alvares Gonçalves, Fundador
            </footer>
          </motion.blockquote>
        </div>
      </section>

      {/* Quem Somos */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionTitle className="text-center">QUEM SOMOS NÓS?</SectionTitle>

          <div className="mt-12 grid gap-12 lg:grid-cols-2 lg:items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="space-y-4 text-[#E0E0E0]"
            >
              <p>
                A <strong className="text-white">CraftSapiens</strong> é a melhor maneira gamificada de se estudar do mundo. Somos pioneiros no uso de Minecraft nativo — sem mods — para ensino, utilizando programação em Java avançada para criar quadros funcionais dentro do jogo.
              </p>
              <p>
                Nossas aulas incluem minigames temáticos e aulas de campo com construções temáticas inteiras, proporcionando uma experiência de aprendizado única e imersiva.
              </p>
              <p>
                É um trabalho 10x mais difícil que aulas convencionais, mas acreditamos que é 10x mais eficaz. Quando o aluno se diverte aprendendo, o conhecimento realmente fica.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex items-center justify-center"
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-bg-card/50 backdrop-blur">
                <div className="flex h-full flex-col items-center justify-center gap-4">
                  <div className="text-5xl">🎬</div>
                  <p className="text-sm text-[#E0E0E0]">Vídeo do Prof. Helton</p>
                  <p className="text-xs text-[#A0A0A0]">Em breve</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Missão, Visão e Valores */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionTitle className="text-center">MISSÃO, VISÃO E VALORES</SectionTitle>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <Target className="h-10 w-10 text-green-cs" />
              <h3 className="mt-4 text-lg font-bold text-white">Missão</h3>
              <p className="mt-2 text-sm text-[#E0E0E0]">
                Tornar o ensino mais atraente e divertido através da gamificação no Minecraft.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <Eye className="h-10 w-10 text-green-cs" />
              <h3 className="mt-4 text-lg font-bold text-white">Visão</h3>
              <p className="mt-2 text-sm text-[#E0E0E0]">
                Ser referência mundial em ensino gamificado, expandindo o alcance da educação através de tecnologia e jogos.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:col-span-2 lg:col-span-1"
            >
              <Heart className="h-10 w-10 text-green-cs" />
              <h3 className="mt-4 text-lg font-bold text-white">Valores</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-[#E0E0E0]">
                {VALUES.map((v) => (
                  <li key={v.title} className="flex items-start gap-2">
                    <v.icon size={16} className="mt-0.5 shrink-0 text-green-cs" />
                    <span><strong className="text-white">{v.title}</strong> — {v.description}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Reconhecimento na Mídia */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionTitle className="text-center">RECONHECIMENTO NA MÍDIA</SectionTitle>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {MEDIA.map((item) => (
              <motion.div
                key={item.name}
                variants={fadeIn}
                className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur transition-all hover:border-green-cs hover:scale-[1.02]"
              >
                <item.icon className="h-10 w-10 text-green-cs" />
                <h3 className="text-sm font-bold text-white">{item.name}</h3>
                <span className="text-xs text-[#A0A0A0]">{item.type}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Nossa Equipe */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionTitle className="text-center">NOSSA EQUIPE</SectionTitle>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-12 grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
          >
            {TEAM.map((member) => (
              <motion.div
                key={member.name}
                variants={fadeIn}
                className="flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-bg-card text-3xl">
                  {member.emoji}
                </span>
                <h3 className="text-sm font-bold text-white">{member.name}</h3>
                <span className="text-xs text-green-cs">{member.role}</span>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-10 text-center">
            <Button href={SOCIAL_LINKS.discord} variant="secondary">
              Junte-se à Equipe
            </Button>
          </div>
        </div>
      </section>

      {/* Hierarquia */}
      <section className="pb-24">
        <div className="mx-auto max-w-5xl px-4 lg:px-6">
          <SectionTitle className="text-center">HIERARQUIA DO SERVIDOR</SectionTitle>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-12 space-y-4"
          >
            {HIERARCHY.map((item, i) => (
              <motion.div
                key={item.role}
                variants={fadeIn}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur"
                style={{ marginLeft: `${i * 16}px` }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-cs/10 border border-green-cs/20">
                  <item.icon className="h-6 w-6 text-green-cs" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{item.role}</h3>
                  <p className="text-sm text-[#E0E0E0]">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}
