"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export function NewsletterConfirmarContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de confirmação não encontrado.");
      return;
    }

    const confirm = async () => {
      try {
        const res = await fetch(
          `/api/newsletter/confirmar?token=${encodeURIComponent(token)}`
        );
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Erro ao confirmar inscrição.");
          return;
        }

        setStatus("success");
        setMessage(data.message);
      } catch {
        setStatus("error");
        setMessage("Erro ao conectar com o servidor.");
      }
    };

    confirm();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-green-cs" />
              <h1 className="mb-2 font-[family-name:var(--font-press-start)] text-lg text-white">
                CONFIRMANDO...
              </h1>
              <p className="text-sm text-[#E0E0E0]">
                Aguarde enquanto confirmamos sua inscrição.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-cs/20">
                <CheckCircle className="h-8 w-8 text-green-cs" />
              </div>
              <h1 className="mb-3 font-[family-name:var(--font-press-start)] text-lg text-white">
                INSCRITO!
              </h1>
              <p className="mb-6 text-sm text-[#E0E0E0]">{message}</p>
              <p className="mb-6 text-xs text-white/50">
                Você receberá novidades da CraftSapiens no seu email.
              </p>
              <Link
                href="/"
                className="inline-block rounded-lg bg-green-cs px-6 py-3 text-sm font-bold uppercase text-white transition-colors hover:bg-green-dark"
              >
                Voltar ao Início
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
              <h1 className="mb-3 font-[family-name:var(--font-press-start)] text-lg text-white">
                ERRO
              </h1>
              <p className="mb-6 text-sm text-[#E0E0E0]">{message}</p>
              <Link
                href="/"
                className="inline-block rounded-lg bg-white/10 px-6 py-3 text-sm font-bold uppercase text-white transition-colors hover:bg-white/20"
              >
                Voltar ao Início
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
