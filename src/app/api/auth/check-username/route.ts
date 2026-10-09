import { NextResponse } from "next/server";
import { findNloginByUsername } from "@/lib/nlogin";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,16}$/;

export async function GET(request: Request) {
  const rateCheck = await checkRateLimit(
    `check-username:${getClientIp(request.headers)}`,
    RATE_LIMITS.checkUsername
  );
  if (!rateCheck.success) {
    return rateLimitResponse(rateCheck, "Muitas consultas. Aguarde um momento.");
  }

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
