import { NextResponse } from "next/server";
import { findNloginByUsername } from "@/lib/nlogin";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username || !USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      { available: false, error: "Username inválido." },
      { status: 400 }
    );
  }

  const existing = await findNloginByUsername(username);

  return NextResponse.json({ available: !existing });
}
