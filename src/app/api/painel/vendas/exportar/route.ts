import { prisma } from "@/lib/prisma";
import { requirePanel } from "@/lib/painel/session";
import { SALE_INCLUDE, salesWhere, toPanelSales } from "@/lib/painel/sales";
import { PANEL_TIMEZONE } from "@/lib/painel/store";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
  REFUNDED: "Reembolsado",
};

const MAX_ROWS = 5000;

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  // Evita que planilhas interpretem o texto como fórmula
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function money(value: number | null): string {
  return value == null ? "" : value.toFixed(2).replace(".", ",");
}

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  timeZone: PANEL_TIMEZONE,
  dateStyle: "short",
  timeStyle: "short",
});

// GET /api/painel/vendas/exportar — mesmos filtros da lista, em CSV (separador ;, para o Excel em português)
export async function GET(request: Request) {
  const access = await requirePanel(request);
  if ("error" in access) return access.error;

  const where = await salesWhere(new URL(request.url).searchParams);
  const orders = await prisma.order.findMany({ where, include: SALE_INCLUDE, orderBy: { createdAt: "desc" }, take: MAX_ROWS });
  const sales = await toPanelSales(orders);

  const header = ["Pedido", "Criado em", "Pago em", "Status", "Nick", "E-mail", "Produto", "Cupom", "Total (R$)", "Pago com juros (R$)", "Parcelas", "Forma", "Entrega"];
  const lines = sales.map((sale) =>
    [
      sale.id,
      dateTime.format(new Date(sale.createdAt)),
      sale.paidAt ? dateTime.format(new Date(sale.paidAt)) : "",
      STATUS_LABELS[sale.status] ?? sale.status,
      sale.buyer.nick ?? "",
      sale.buyer.email,
      sale.items.map((i) => (i.quantity > 1 ? `${i.quantity}x ${i.name}` : i.name)).join(", "),
      sale.coupon ? `${sale.coupon.code} (${sale.coupon.discount}%)` : "",
      money(sale.total),
      money(sale.paidAmount),
      sale.installments ?? "",
      sale.paymentMethod ?? "",
      sale.delivery,
    ]
      .map(csvCell)
      .join(";")
  );

  const stamp = new Date().toISOString().slice(0, 10);
  // BOM para o Excel abrir os acentos corretamente
  return new Response("﻿" + [header.join(";"), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="vendas-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
