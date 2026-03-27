import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { payment } from "@/lib/mercadopago";
import { sendOrderConfirmationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: Request) {
  const body = await request.json();
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get("orderId");

  // MercadoPago sends different notification types
  // We only care about payment notifications
  if (body.type !== "payment" || !body.data?.id) {
    return NextResponse.json({ received: true });
  }

  // Verify webhook signature if secret is configured
  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");

  if (process.env.MERCADOPAGO_WEBHOOK_SECRET && xSignature && xRequestId) {
    const parts = xSignature.split(",");
    const tsRaw = parts.find((p) => p.trim().startsWith("ts="));
    const v1Raw = parts.find((p) => p.trim().startsWith("v1="));

    if (tsRaw && v1Raw) {
      const ts = tsRaw.split("=")[1];
      const v1 = v1Raw.split("=")[1];

      const manifest = `id:${body.data.id};request-id:${xRequestId};ts:${ts};`;
      const hmac = crypto
        .createHmac("sha256", process.env.MERCADOPAGO_WEBHOOK_SECRET)
        .update(manifest)
        .digest("hex");

      if (hmac !== v1) {
        console.error("[webhook] Invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }
  }

  try {
    const paymentData = await payment.get({ id: Number(body.data.id) });

    if (!paymentData) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const externalRef = paymentData.external_reference || orderId;
    if (!externalRef) {
      console.error("[webhook] No order reference in payment");
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({
      where: { id: externalRef },
      include: {
        user: { include: { nlogin: true } },
        items: { include: { product: true } },
      },
    });

    if (!order) {
      console.error(`[webhook] Order ${externalRef} not found`);
      return NextResponse.json({ received: true });
    }

    // Map MercadoPago status to our OrderStatus
    let newStatus: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";
    switch (paymentData.status) {
      case "approved":
        newStatus = "APPROVED";
        break;
      case "rejected":
      case "cancelled":
        newStatus = "REJECTED";
        break;
      case "refunded":
      case "charged_back":
        newStatus = "REFUNDED";
        break;
      default:
        newStatus = "PENDING";
    }

    // Only process if status actually changed
    if (order.status === newStatus) {
      return NextResponse.json({ received: true });
    }

    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: newStatus,
          paymentMethod: paymentData.payment_method_id || null,
          paymentId: String(paymentData.id),
        },
      });

      // On approval: clear cart and update stock
      if (newStatus === "APPROVED") {
        // Clear user's cart
        await tx.cartItem.deleteMany({
          where: { userId: order.userId },
        });

        // Update product stock for items with limited stock
        for (const item of order.items) {
          if (item.product.stock >= 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      }
    });

    // Send confirmation email fire-and-forget on approval
    if (newStatus === "APPROVED" && order.user.email) {
      const username = order.user.nlogin?.last_name || "Jogador";
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

    return NextResponse.json({ received: true, status: newStatus });
  } catch (err) {
    console.error("[webhook] Processing error:", (err as Error).message);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
