import type { Metadata } from "next";
import { LoginContent } from "@/components/auth/LoginContent";

export const metadata: Metadata = {
  title: "Login",
  description: "Faça login na CraftSapiens com seu nick do Minecraft.",
};

export default function LoginPage() {
  return <LoginContent />;
}
