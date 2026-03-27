"use client";

import { useEffect, useState, Suspense } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  XCircle,
  ShoppingBag,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";

interface OrderData {
  id: string;
  status: string;
  total: number;
  paymentMethod: string | null;
  items: {
    id: string;
    product: { name: string; category: string };
    quantity: number;
    price: number;
  }[];
  createdAt: string;
}

const STATUS_CONFIG = {
  success: {
    icon: CheckCircle,
    color: "#4CAF50",
    title: "Pedido Confirmado!",
    subtitle: "Seu pagamento foi aprovado com sucesso.",
    message:
      "Seus itens serão ativados automaticamente. Para VIPs e Ranks, entre no servidor Minecraft para que as permissões sejam aplicadas.",
  },
  pending: {
    icon: Clock,
    color: "#FF9800",
    title: "Pagamento Pendente",
    subtitle: "Estamos aguardando a confirmação do seu pagamento.",
    message:
      "Para pagamentos via boleto, a compensação pode levar até 3 dias úteis. Para PIX, a confirmação é instantânea. Você receberá um email quando o pagamento for aprovado.",
  },
  failure: {
    icon: XCircle,
    color: "#F44336",
    title: "Pagamento Não Aprovado",
    subtitle: "Houve um problema com seu pagamento.",
    message:
      "Seu pedido foi criado mas o pagamento não foi aprovado. Você pode tentar novamente com outro método de pagamento.",
  },
};

function PedidoResultInner({ status }: { status: "success" | "pending" | "failure" }) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);

  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  const externalReference = searchParams.get("external_reference");
  const collectionStatus = searchParams.get("collection_status");

  useEffect(() => {
    if (externalReference && session) {
      setLoading(true);
      fetch(`/api/loja/pedido/${externalReference}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setOrder(data);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [externalReference, session]);

  return (
    <>
      <PageHero
        title="PEDIDO"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Loja", href: "/loja" },
          { label: "Pedido" },
        ]}
      />

      <div className="mx-auto max-w-2xl px-4 pb-24 lg:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Icon
              size={64}
              className="mx-auto"
              style={{ color: config.color }}
            />
          </motion.div>

          <h2 className="mt-6 text-2xl font-bold text-white">{config.title}</h2>
          <p className="mt-2 text-[#A0A0A0]">{config.subtitle}</p>

          <p className="mt-6 text-sm leading-relaxed text-[#A0A0A0]">
            {config.message}
          </p>

          {/* Order details */}
          {loading ? (
            <div className="mt-6 flex justify-center">
              <Loader2 size={24} className="animate-spin text-green-cs" />
            </div>
          ) : order ? (
            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4 text-left">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#A0A0A0]">Pedido</span>
                <span className="font-mono text-xs text-white">
                  #{order.id.slice(0, 12)}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-white">
                      {item.quantity}x {item.product.name}
                    </span>
                    <span className="text-[#A0A0A0]">
                      R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex justify-between border-t border-white/10 pt-3">
                <span className="font-bold text-white">Total</span>
                <span className="font-bold text-green-cs">
                  R$ {order.total.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          ) : null}

          {/* Action buttons */}
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {status === "failure" ? (
              <Button href="/loja/carrinho">TENTAR NOVAMENTE</Button>
            ) : (
              <Button href="/perfil/compras">
                <ShoppingBag size={16} className="mr-2" />
                VER MINHAS COMPRAS
              </Button>
            )}
            <Button href="/loja" variant="secondary">
              <ArrowLeft size={16} className="mr-2" />
              VOLTAR À LOJA
            </Button>
          </div>
        </motion.div>
      </div>
    </>
  );
}

export function PedidoResultContent({
  status,
}: {
  status: "success" | "pending" | "failure";
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-cs" />
        </div>
      }
    >
      <PedidoResultInner status={status} />
    </Suspense>
  );
}
