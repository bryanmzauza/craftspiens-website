import { NextResponse } from "next/server";
import { SERVER_IP } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ServerStatus {
  online: boolean;
  players: { online: number; max: number };
  version: string;
  motd: string;
}

export async function GET() {
  try {
    const host = process.env.MINECRAFT_SERVER_HOST || SERVER_IP;
    const port = Number(process.env.MINECRAFT_SERVER_PORT || 25565);

    // Status obtained from the public mcsrvstat.us API
    const res = await fetch(
      `https://api.mcsrvstat.us/3/${host}:${port}`,
      { next: { revalidate: 30 } }
    );

    if (!res.ok) {
      return NextResponse.json<ServerStatus>({
        online: false,
        players: { online: 0, max: 0 },
        version: "",
        motd: "",
      });
    }

    const data = await res.json();

    return NextResponse.json<ServerStatus>({
      online: data.online ?? false,
      players: {
        online: data.players?.online ?? 0,
        max: data.players?.max ?? 0,
      },
      version: data.version ?? "",
      motd: data.motd?.clean?.[0] ?? "",
    });
  } catch {
    return NextResponse.json<ServerStatus>({
      online: false,
      players: { online: 0, max: 0 },
      version: "",
      motd: "",
    });
  }
}
