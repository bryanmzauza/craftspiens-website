import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginContent } from "@/components/auth/LoginContent";

export const metadata: Metadata = {
  title: "Login",
  description: "Faça login na CraftSapiens com seu nick do Minecraft.",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
