"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, Check, Mail, Phone, MapPin, Monitor } from "lucide-react";
import {
  SITE_DESCRIPTION,
  SERVER_IP,
  CONTACT_EMAIL,
  CONTACT_PHONE,
  SOCIAL_LINKS,
  DISCLAIMER,
  COPYRIGHT,
} from "@/lib/constants";
import { SocialIcons } from "@/components/ui/SocialIcons";

const INSTITUTIONAL_LINKS = [
  { label: "Sobre", href: "/sobre" },
  { label: "Aulas", href: "/aulas" },
  { label: "Cronograma", href: "/cronograma" },
  { label: "Blog", href: "/blog" },
  { label: "Contato", href: "/contato" },
];

const SUPPORT_LINKS = [
  { label: "Termos e Condições", href: "/termos" },
  { label: "Política de Privacidade", href: "/termos#privacidade" },
  { label: "FAQ", href: "/contato#faq" },
  { label: "Status do Servidor", href: "/status" },
];

export function Footer() {
  const [copied, setCopied] = useState(false);

  const copyIp = async () => {
    await navigator.clipboard.writeText(SERVER_IP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="relative z-[1] border-t border-white/5 bg-bg-footer">
      {/* Newsletter Bar */}
      <div className="border-b border-white/10 bg-bg-card/50">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between lg:px-6">
          <p className="text-lg font-semibold">
            📬 Fique por dentro das novidades
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full max-w-md gap-2"
          >
            <input
              type="email"
              placeholder="Seu melhor e-mail"
              className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-green-cs focus:outline-none"
              required
            />
            <button
              type="submit"
              className="rounded-lg bg-green-cs px-6 py-2.5 text-sm font-bold uppercase text-white transition-colors hover:bg-green-dark"
            >
              Inscrever
            </button>
          </form>
        </div>
      </div>

      {/* Main Content - 4 columns */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
        {/* Col 1: Logo & Social */}
        <div className="space-y-4">
          <span className="font-[family-name:var(--font-press-start)] text-green-cs text-xs">
            CRAFTSAPIENS
          </span>
          <p className="text-sm text-[#E0E0E0]">{SITE_DESCRIPTION}</p>
          <SocialIcons links={SOCIAL_LINKS} />
          <Link
            href="/contato"
            className="mt-2 inline-block text-sm font-bold uppercase text-[#A0A0A0] transition-colors hover:text-green-cs"
          >
            Contato
          </Link>
        </div>

        {/* Col 2: Institucional */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            Institucional
          </h3>
          <ul className="space-y-2.5">
            {INSTITUTIONAL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-[#A0A0A0] transition-colors hover:text-green-cs"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 3: Suporte */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            Suporte
          </h3>
          <ul className="space-y-2.5">
            {SUPPORT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-[#A0A0A0] transition-colors hover:text-green-cs"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Col 4: Contato */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
            Contato
          </h3>
          <ul className="space-y-3">
            <li>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="flex items-center gap-2 text-sm text-[#A0A0A0] transition-colors hover:text-green-cs"
              >
                <Mail size={16} />
                {CONTACT_EMAIL}
              </a>
            </li>
            <li>
              <a
                href={`https://wa.me/5541995871942`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[#A0A0A0] transition-colors hover:text-green-cs"
              >
                <Phone size={16} />
                {CONTACT_PHONE}
              </a>
            </li>
            <li className="flex items-center gap-2 text-sm text-[#A0A0A0]">
              <MapPin size={16} />
              Porto Alegre, RS
            </li>
            <li>
              <button
                onClick={copyIp}
                className="flex items-center gap-2 text-sm text-[#A0A0A0] transition-colors hover:text-green-cs"
              >
                <Monitor size={16} />
                <span className="font-[family-name:var(--font-jetbrains-mono)] text-xs">
                  {SERVER_IP}
                </span>
                {copied ? (
                  <Check size={14} className="text-green-cs" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright & Legal */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center lg:px-6">
          <p className="text-xs text-[#A0A0A0]">{DISCLAIMER}</p>
          <p className="mt-1 text-xs text-[#A0A0A0]">{COPYRIGHT}</p>
        </div>
      </div>
    </footer>
  );
}
