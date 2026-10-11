import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/perfil", "/loja/carrinho", "/loja/checkout", "/loja/pedido", "/confirmar-email"];
const authRoutes = ["/login", "/registro", "/recuperar-senha", "/redefinir-senha"];

// Páginas e APIs que exigem e-mail confirmado. As APIs só são bloqueadas em
// operações que alteram dados; consultas de leitura continuam abertas.
const verifiedPages = ["/perfil", "/loja/carrinho", "/loja/checkout", "/loja/pedido"];
const verifiedApis = [
  "/api/perfil",
  "/api/carrinho",
  "/api/loja/checkout",
  "/api/cupons",
  "/api/forum",
  "/api/aulas/progresso",
];
const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
// Liberada sem e-mail confirmado: vincular o Google é uma das formas de confirmá-lo
const unverifiedAllowedApis = ["/api/perfil/vinculos/iniciar"];

const matches = (pathname: string, routes: string[]) =>
  routes.some((route) => pathname === route || pathname.startsWith(route + "/"));

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;
  const isLoggedIn = !!user;
  const emailConfirmed = user?.emailConfirmed === true;

  // APIs: bloqueia escrita de contas logadas sem e-mail confirmado
  if (pathname.startsWith("/api/")) {
    if (
      isLoggedIn &&
      !emailConfirmed &&
      !READ_METHODS.has(req.method) &&
      matches(pathname, verifiedApis) &&
      !matches(pathname, unverifiedAllowedApis)
    ) {
      return NextResponse.json(
        { error: "Confirme seu e-mail para continuar.", code: "EmailNaoVerificado" },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  if (matches(pathname, protectedRoutes) && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Conta sem e-mail confirmado: primeiro confirma, depois segue para onde ia
  if (isLoggedIn && !emailConfirmed && matches(pathname, verifiedPages)) {
    const confirmUrl = new URL("/confirmar-email", req.nextUrl.origin);
    confirmUrl.searchParams.set("redirect", pathname + req.nextUrl.search);
    return NextResponse.redirect(confirmUrl);
  }

  if (authRoutes.some((route) => pathname === route) && isLoggedIn) {
    return NextResponse.redirect(new URL(emailConfirmed ? "/perfil" : "/confirmar-email", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/perfil/:path*",
    "/loja/carrinho",
    "/loja/checkout",
    "/loja/pedido/:path*",
    "/confirmar-email",
    "/login",
    "/registro",
    "/recuperar-senha",
    "/redefinir-senha",
    "/api/perfil/:path*",
    "/api/carrinho/:path*",
    "/api/loja/checkout",
    "/api/cupons/:path*",
    "/api/forum/:path*",
    "/api/aulas/progresso/:path*",
  ],
};
