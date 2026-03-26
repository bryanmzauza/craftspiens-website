import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";
import { Providers } from "@/app/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const pressStart = Press_Start_2P({
  variable: "--font-press-start",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CraftSapiens — O Maior Metaverso Educacional do Mundo",
    template: "%s | CraftSapiens",
  },
  description:
    "Construa seu futuro jogando. Aulas reais, gamificação e comunidade no Minecraft. Aprenda de forma divertida com a CraftSapiens.",
  keywords: [
    "craftsapiens",
    "minecraft educacional",
    "aulas minecraft",
    "metaverso educacional",
    "ensino gamificado",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} ${pressStart.variable} antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-bg-primary text-white">
        <Providers>
          <AnimatedBackground />
          <Navbar />
          <main className="relative z-[1] flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
