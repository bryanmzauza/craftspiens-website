import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getEnv } from "@/lib/env";
import { getNloginById } from "@/lib/nlogin";
import { getPaymentClient } from "@/lib/mercadopago";
import { verifyMpSignature } from "@/lib/mercadopago-signature";
import { isUnlimitedStock } from "@/lib/products";
import { sendOrderConfirmationEmail } from "@/lib/email";

type OrderStatus = "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

// Allowed transitions: a late or repeated notification never moves an order backwards
const ALLOWED_FROM: Record<Exclude<OrderStatus, "PENDING">, OrderStatus[]> = {
  APPROVED: ["PENDING", "REJECTED"],
  REJECTED: ["PENDING"],
  REFUNDED: ["APPROVED"],
};

function mapStatus(mpStatus: string | undefined): Exclude<OrderStatus, "PENDING"> | null {
  switch (mpStatus) {
    case "approved":
      return "APPROVED";
    case "rejected":
    case "cancelled":
      return "REJECTED";
    case "refunded":
    case "charged_back":
      return "REFUNDED";
    default:
      return null; // pending, in_process, authorized... nothing to do yet
  }
}

function toCents(value: number): number {
  return Math.round(value * 100);
}

export async function POST(request: Request) {
  let secret: string;
  try {
    secret = getEnv().MERCADOPAGO_WEBHOOK_SECRET;
  } catch (err) {
    console.error("[webhook] Misconfigured environment:", (err as Error).message);
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const { searchParams } = new URL(request.url);

  // Only "payment" notifications from the Webhooks API are handled.
  // Legacy IPN calls (?topic=...) and other types are acknowledged and ignored.
  const type = searchParams.get("type") ?? body?.type;
  const dataId = searchParams.get("data.id") ?? body?.data?.id?.toString();
  if (type !== "payment" || !dataId) {
    return NextResponse.json({ received: true });
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  if (!xSignature || !xRequestId || !verifyMpSignature({ xSignature, xRequestId, dataId, secret })) {
    console.error("[webhook] Missing or invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    // Never trust the notification body: always re-fetch the payment from MercadoPago
    const paymentData = await getPaymentClient().get({ id: dataId });

    const orderId = paymentData.external_reference;
    if (!orderId) {
      console.error(`[webhook] Payment ${paymentData.id} has no external_reference`);
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      console.error(`[webhook] Order ${orderId} not found`);
      return NextResponse.json({ received: true });
    }

    const newStatus = mapStatus(paymentData.status);
    if (!newStatus) {
      return NextResponse.json({ received: true });
    }

    if (newStatus === "APPROVED") {
      const amountOk =
        toCents(paymentData.transaction_amount ?? 0) >= toCents(Number(order.total));
      if (paymentData.currency_id !== "BRL" || !amountOk) {
        console.error(
          `[webhook] Amount/currency mismatch for order ${order.id}: ` +
            `${paymentData.transaction_amount} ${paymentData.currency_id} (expected ${order.total} BRL)`
        );
        return NextResponse.json({ received: true });
      }
    }

    const applied = await prisma.$transaction(async (tx) => {
      // Conditional update makes repeated/concurrent notifications idempotent
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: { in: ALLOWED_FROM[newStatus] } },
        data: {
          status: newStatus,
          paymentMethod: paymentData.payment_method_id || null,
          paymentId: String(paymentData.id),
        },
      });
      if (updated.count === 0) return false;

      if (newStatus === "APPROVED") {
        for (const item of order.items) {
          // Never let limited stock go below zero (-1 means unlimited)
          const decremented = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (decremented.count === 0 && !isUnlimitedStock(item.product.stock)) {
            console.error(`[webhook] Oversold: order ${order.id}, product ${item.productId}`);
          }
        }

        // Remove only the purchased products from the cart
        await tx.cartItem.deleteMany({
          where: {
            userId: order.userId,
            productId: { in: order.items.map((item) => item.productId) },
          },
        });
      }

      return true;
    });

    // Send confirmation email fire-and-forget, only once per approval
    if (applied && newStatus === "APPROVED" && order.user.email) {
      const nlogin = await getNloginById(order.user.nloginId);
      const username = nlogin?.last_name || "Jogador";
      const itemsList = order.items.map(
        (item) => `${item.quantity}x ${item.product.name}`
      );

      sendOrderConfirmationEmail(
        order.user.email,
        username,
        order.id,
        Number(order.total),
        itemsList,
        paymentData.payment_method_id || "pix"
      ).catch((err) => {
        console.error("[webhook] Email error:", (err as Error).message);
      });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook] Processing error:", (err as Error).message);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
