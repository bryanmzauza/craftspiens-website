import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = ["/perfil", "/loja/carrinho"];
const authRoutes = ["/login", "/registro"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isAuthRoute = authRoutes.some((route) => pathname === route);

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/perfil", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/perfil/:path*",
    "/loja/carrinho",
    "/login",
    "/registro",
  ],
};
