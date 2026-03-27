import type { Metadata } from "next";
import { CheckoutContent } from "@/components/loja/CheckoutContent";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Finalize sua compra com segurança.",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutContent />;
}
