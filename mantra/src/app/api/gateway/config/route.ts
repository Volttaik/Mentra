import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const CONNECTOR_PASSWORD = "liquid4*";

export async function POST(req: Request) {
  const { password, webhookUrl, sharedSecret, waNumber } = await req.json();
  if (password !== CONNECTOR_PASSWORD)
    return NextResponse.json({ error: "Invalid password" }, { status: 403 });

  if (!webhookUrl || !sharedSecret || !waNumber)
    return NextResponse.json({ error: "webhookUrl, sharedSecret, and waNumber are required" }, { status: 400 });

  const existing = await prisma.gatewayConfig.findFirst({ orderBy: { createdAt: "desc" } });

  const config = existing
    ? await prisma.gatewayConfig.update({
        where: { id: existing.id },
        data: { webhookUrl, sharedSecret, waNumber, isActive: false, connectedAt: null },
      })
    : await prisma.gatewayConfig.create({ data: { webhookUrl, sharedSecret, waNumber } });

  return NextResponse.json({ ok: true, id: config.id });
}
