"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Phone,
  Mail,
  MessageCircle,
  ChevronDown,
  MapPin,
  Send,
} from "lucide-react";
import { PageHero } from "@/components/ui/PageHero";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SocialIcons } from "@/components/ui/SocialIcons";
import { SOCIAL_LINKS, CONTACT_EMAIL, CONTACT_PHONE, SERVER_IP } from "@/lib/constants";

const CONTACT_CHANNELS = [
  {
    icon: Phone,
    title: "WhatsApp",
    description: CONTACT_PHONE,
    action: "Chamar",
    href: "https://wa.me/5541995871942?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20CraftSapiens!",
    highlight: true,
  },
  {
    icon: Mail,
    title: "Email",
    description: CONTACT_EMAIL,
    action: "Enviar",
    href: `mailto:${CONTACT_EMAIL}`,
    highlight: false,
  },
  {
    icon: MessageCircle,
    title: "Discord",
    description: "Comunidade online",
    action: "Entrar",
    href: SOCIAL_LINKS.discord,
    highlight: false,
  },
];

const SUBJECT_OPTIONS = [
  "Dúvida sobre aulas",
  "Suporte técnico (servidor)",
  "Informações sobre planos VIP",
  "Parceria / Mídia",
  "Denúncia / Ouvidoria",
  "Outro",
];

const FAQ_ITEMS = [
  {
    question: "Como acesso o servidor?",
    answer: `Abra o Minecraft Java Edition, clique em "Multiplayer" e adicione o servidor com o IP: ${SERVER_IP}. Você precisará de uma conta registrada no nosso site.`,
  },
  {
    question: "Quanto custa?",
    answer: "O acesso básico ao servidor é totalmente gratuito! Temos planos VIP e Premium com benefícios extras, disponíveis na nossa loja.",
  },
  {
    question: "Qual a idade mínima?",
    answer: "A idade mínima para criar uma conta é 13 anos. Menores de 13 anos devem ser acompanhados por um responsável.",
  },
  {
    question: "Funciona no celular?",
    answer: "Recomendamos o Minecraft Java Edition (computador) para a melhor experiência. A versão Bedrock (celular) pode ter limitações de compatibilidade.",
  },
  {
    question: "Como funciona a Moeda SAPIENS?",
    answer: "A Moeda SAPIENS é nossa moeda virtual sem valor real. Você ganha participando de aulas, completando missões e conquistando desafios. Use para personalizar seu personagem e desbloquear conteúdos!",
  },
  {
    question: "Como ser Premium/VIP?",
    answer: "Acesse nossa loja e escolha o plano que melhor atende suas necessidades. Aceitamos PIX, cartão de crédito e boleto.",
  },
];

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 p-5 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-white">{question}</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-green-cs transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm text-[#E0E0E0]">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function ContatoContent() {
  const [formState, setFormState] = useState({
    nome: "",
    email: "",
    assunto: "",
    mensagem: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFormError("");

    try {
      const res = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formState.nome,
          email: formState.email,
          category: formState.assunto,
          subject: formState.assunto,
          message: formState.mensagem,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Erro ao enviar mensagem.");
        return;
      }

      setSent(true);
      setFormState({ nome: "", email: "", assunto: "", mensagem: "" });
    } catch {
      setFormError("Erro ao conectar com o servidor. Tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHero
        title="CONTATO"
        subtitle="Fale conosco! Estamos prontos para ajudar."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Contato" },
        ]}
      />

      {/* Canais de Contato */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 sm:grid-cols-3"
          >
            {CONTACT_CHANNELS.map((channel) => (
              <motion.a
                key={channel.title}
                variants={fadeIn}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur transition-all hover:border-green-cs hover:scale-[1.02]"
              >
                <channel.icon className="h-10 w-10 text-green-cs" />
                <h3 className="text-lg font-bold text-white">{channel.title}</h3>
                <p className="text-sm text-[#E0E0E0]">{channel.description}</p>
                <span className="mt-auto rounded-lg bg-green-cs/10 px-4 py-2 text-sm font-bold uppercase text-green-cs transition-colors group-hover:bg-green-cs group-hover:text-white">
                  {channel.action}
                </span>
              </motion.a>
            ))}
          </motion.div>

          <p className="mt-6 text-center text-sm text-green-cs">
            ⚡ Respondemos via WhatsApp mais rapidamente
          </p>
        </div>
      </section>

      {/* Redes Sociais */}
      <section className="pb-16">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <SectionTitle className="text-center">REDES SOCIAIS</SectionTitle>
          <div className="mt-8 flex justify-center">
            <SocialIcons links={SOCIAL_LINKS} size={28} />
          </div>
        </div>
      </section>

      {/* Formulário + FAQ */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Formulário */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-bold text-white">Envie uma Mensagem</h3>

              {sent ? (
                <div className="mt-6 rounded-xl border border-green-cs/20 bg-green-cs/10 p-8 text-center">
                  <Send className="mx-auto h-10 w-10 text-green-cs" />
                  <p className="mt-4 font-bold text-white">Mensagem enviada!</p>
                  <p className="mt-2 text-sm text-[#E0E0E0]">
                    Responderemos em até 10 dias úteis.
                  </p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-4 text-sm text-green-cs hover:underline"
                  >
                    Enviar outra mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {formError && (
                    <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                      {formError}
                    </div>
                  )}
                  <div>
                    <label htmlFor="nome" className="block text-sm font-medium text-white">
                      Nome *
                    </label>
                    <input
                      id="nome"
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      value={formState.nome}
                      onChange={(e) => setFormState((s) => ({ ...s, nome: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
                      placeholder="Seu nome"
                    />
                  </div>

                  <div>
                    <label htmlFor="email-contato" className="block text-sm font-medium text-white">
                      Email *
                    </label>
                    <input
                      id="email-contato"
                      type="email"
                      required
                      value={formState.email}
                      onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="assunto" className="block text-sm font-medium text-white">
                      Assunto *
                    </label>
                    <select
                      id="assunto"
                      required
                      value={formState.assunto}
                      onChange={(e) => setFormState((s) => ({ ...s, assunto: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white focus:border-green-cs focus:outline-none"
                    >
                      <option value="" disabled className="bg-bg-primary">Selecione...</option>
                      {SUBJECT_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} className="bg-bg-primary">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="mensagem" className="block text-sm font-medium text-white">
                      Mensagem *
                    </label>
                    <textarea
                      id="mensagem"
                      required
                      minLength={10}
                      maxLength={2000}
                      rows={5}
                      value={formState.mensagem}
                      onChange={(e) => setFormState((s) => ({ ...s, mensagem: e.target.value }))}
                      className="mt-1 w-full resize-none rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
                      placeholder="Descreva como podemos ajudar..."
                    />
                  </div>

                  {/* Honeypot anti-bot */}
                  <div className="hidden" aria-hidden="true">
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full rounded-lg bg-green-cs px-6 py-3 text-sm font-bold uppercase text-white transition-all hover:bg-green-dark hover:shadow-[0_0_20px_rgba(76,175,80,0.3)] disabled:opacity-50"
                  >
                    {sending ? "Enviando..." : "Enviar Mensagem"}
                  </button>
                </form>
              )}
            </motion.div>

            {/* FAQ */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h3 id="faq" className="text-xl font-bold text-white">FAQ Rápido</h3>
              <div className="mt-6 space-y-3">
                {FAQ_ITEMS.map((item) => (
                  <FaqItem key={item.question} {...item} />
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Localização */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-4 text-center lg:px-6">
          <div className="flex items-center justify-center gap-2 text-[#E0E0E0]">
            <MapPin size={18} className="text-green-cs" />
            <span>Localização: Porto Alegre, RS</span>
          </div>
        </div>
      </section>
    </>
  );
}
