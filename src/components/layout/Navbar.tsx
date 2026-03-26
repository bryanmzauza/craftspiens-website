"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X, User, ShoppingBag, Settings, LogOut, ChevronDown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { NAV_LINKS } from "@/lib/constants";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          {session?.user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://mc-heads.net/avatar/${session.user.username}/24`}
                  alt={session.user.username}
                  width={24}
                  height={24}
                  className="rounded"
                />
                <span>{session.user.username}</span>
                <ChevronDown size={14} className={`transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-white/10 bg-bg-card/95 py-1 shadow-xl backdrop-blur">
                  <Link
                    href="/perfil"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5"
                  >
                    <User size={16} /> Meu Perfil
                  </Link>
                  <Link
                    href="/perfil/compras"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5"
                  >
                    <ShoppingBag size={16} /> Minhas Compras
                  </Link>
                  <Link
                    href="/perfil/configuracoes"
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-white hover:bg-white/5"
                  >
                    <Settings size={16} /> Configurações
                  </Link>
                  <hr className="my-1 border-white/10" />
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-error hover:bg-white/5"
                  >
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
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
            </>
          )}
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

          {session?.user ? (
            <>
              <div className="flex items-center gap-3 px-4 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://mc-heads.net/avatar/${session.user.username}/28`}
                  alt={session.user.username}
                  width={28}
                  height={28}
                  className="rounded"
                />
                <span className="text-sm font-medium text-white">{session.user.username}</span>
              </div>
              <Link
                href="/perfil"
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-white hover:bg-white/5"
              >
                <User size={18} /> Meu Perfil
              </Link>
              <Link
                href="/perfil/compras"
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-white hover:bg-white/5"
              >
                <ShoppingBag size={18} /> Minhas Compras
              </Link>
              <Link
                href="/perfil/configuracoes"
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-white hover:bg-white/5"
              >
                <Settings size={18} /> Configurações
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-2 rounded-lg px-4 py-3 text-base font-medium text-error hover:bg-white/5"
              >
                <LogOut size={18} /> Sair
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
