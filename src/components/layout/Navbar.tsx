"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        scrolled
          ? "bg-[rgba(26,26,46,0.95)] backdrop-blur-[10px] border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="font-[family-name:var(--font-press-start)] text-green-cs text-sm lg:text-base">
            CRAFTSAPIENS
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive(link.href)
                  ? "text-green-cs border-b-2 border-green-cs pb-1"
                  : "text-white hover:text-green-cs"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Desktop Auth */}
        <div className="hidden lg:flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border-2 border-white px-5 py-2 text-sm font-bold uppercase text-white transition-colors hover:bg-white/10"
          >
            Login
          </Link>
          <Link
            href="/registro"
            className="rounded-lg bg-green-cs px-5 py-2 text-sm font-bold uppercase text-white transition-all hover:bg-green-dark hover:shadow-[0_0_20px_rgba(76,175,80,0.3)]"
          >
            Criar Conta Grátis
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden text-white p-2"
          aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-16 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-16 right-0 z-50 h-[calc(100vh-4rem)] w-72 bg-bg-primary/95 backdrop-blur-xl border-l border-white/10 transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-2 p-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-green-cs/10 text-green-cs"
                  : "text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}

          <hr className="my-4 border-white/10" />

          <Link
            href="/login"
            className="rounded-lg border-2 border-white px-4 py-3 text-center text-sm font-bold uppercase text-white transition-colors hover:bg-white/10"
          >
            Login
          </Link>
          <Link
            href="/registro"
            className="rounded-lg bg-green-cs px-4 py-3 text-center text-sm font-bold uppercase text-white transition-all hover:bg-green-dark"
          >
            Criar Conta Grátis
          </Link>
        </div>
      </div>
    </header>
  );
}
