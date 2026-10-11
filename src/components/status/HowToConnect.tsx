"use client";

import { Fragment, useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy, Monitor, Smartphone } from "lucide-react";
import { BEDROCK_PORT, SERVER_IP } from "@/lib/constants";

/** Endereço com quebra de linha permitida só depois dos pontos */
function BreakableAddress({ value }: { value: string }) {
  return (
    <>
      {value.split(".").map((part, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <>
              .<wbr />
            </>
          )}
          {part}
        </Fragment>
      ))}
    </>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sem permissão de área de transferência: o valor continua visível
    }
  };

  return (
    <div>
      <p className="text-xs text-[#A0A0A0]">{label}</p>
      <button
        type="button"
        onClick={copy}
        className="group mt-1.5 flex w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 px-3.5 py-2.5 text-left transition-colors hover:border-green-cs/60"
      >
        <span className="min-w-0 font-[family-name:var(--font-jetbrains-mono)] text-sm text-white">
          <BreakableAddress value={value} />
        </span>
        {copied ? (
          <Check size={15} className="shrink-0 text-green-cs" aria-hidden="true" />
        ) : (
          <Copy size={15} className="shrink-0 text-[#A0A0A0] transition-colors group-hover:text-white" aria-hidden="true" />
        )}
        <span className="sr-only">{copied ? `${label} copiado` : `Copiar ${label.toLowerCase()}`}</span>
      </button>
    </div>
  );
}

const EDITIONS = [
  {
    icon: Monitor,
    name: "Java Edition",
    devices: "Computador (Windows, macOS e Linux)",
    fields: [{ label: "Endereço do servidor", value: SERVER_IP }],
    steps: [
      "Abra o Minecraft e entre em Multijogador",
      "Clique em Adicionar servidor",
      "Cole o endereço acima e salve. Não é preciso informar a porta",
    ],
  },
  {
    icon: Smartphone,
    name: "Bedrock Edition",
    devices: "Celular, tablet e Windows (versão da Microsoft Store)",
    fields: [
      { label: "Endereço do servidor", value: SERVER_IP },
      { label: "Porta", value: String(BEDROCK_PORT) },
    ],
    steps: [
      "Abra o Minecraft e toque em Jogar",
      "Na aba Servidores, toque em Adicionar servidor",
      "Preencha o endereço e a porta acima e salve",
    ],
  },
];

export function HowToConnect() {
  return (
    <section className="pb-16">
      <div className="mx-auto max-w-4xl px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-[family-name:var(--font-press-start)] text-xl text-white sm:text-2xl">
            COMO ENTRAR
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#E0E0E0] sm:text-base">
            O servidor aceita as duas edições do Minecraft. Jogadores do Java e do Bedrock entram no
            mesmo servidor e jogam juntos, com a mesma conta.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {EDITIONS.map((edition, i) => (
            <motion.div
              key={edition.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-cs/10 text-green-cs">
                  <edition.icon size={22} aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-white">{edition.name}</h3>
                  <p className="mt-0.5 text-sm text-[#A0A0A0]">{edition.devices}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {edition.fields.map((field) => (
                  <CopyField key={field.label} label={field.label} value={field.value} />
                ))}
              </div>

              <ol className="mt-6 space-y-2 border-t border-white/10 pt-5 text-sm text-[#E0E0E0]">
                {edition.steps.map((step, n) => (
                  <li key={step} className="flex gap-3">
                    <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs leading-5 text-green-cs">
                      {n + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
