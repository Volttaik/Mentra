import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await prisma.gatewayConfig.findFirst({ orderBy: { createdAt: "desc" } });
  if (!config) return NextResponse.json({ connected: false });
  return NextResponse.json({
    connected: config.isActive,
    waNumber: config.waNumber,
    connectedAt: config.connectedAt,
  });
}
