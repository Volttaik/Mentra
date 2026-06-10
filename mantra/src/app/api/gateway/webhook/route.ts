import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const waSessions = new Map<string, string>();

export async function POST(req: Request) {
  const config = await prisma.gatewayConfig.findFirst({ orderBy: { createdAt: "desc" } });
  if (!config?.isActive) return NextResponse.json({ error: "Gateway not active" }, { status: 503 });

  const secret = req.headers.get("x-gateway-secret");
  if (secret !== config.sharedSecret)
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });

  const { from, message, sessionApiKey } = await req.json();
  if (!from || !message) return NextResponse.json({ error: "from and message required" }, { status: 400 });

  let apiKey = waSessions.get(from) ?? sessionApiKey ?? null;

  if (!apiKey) {
    return NextResponse.json({
      reply: "👋 Welcome to Mentra! Please send your API key to get started. You can find it in your Mentra settings under API Keys.",
    });
  }

  const keyRecord = await prisma.apiKey.findFirst({ where: { key: apiKey, isActive: true } });
  if (!keyRecord) {
    waSessions.delete(from);
    return NextResponse.json({ reply: "❌ Invalid API key. Please send a valid Mentra API key." });
  }

  if (!waSessions.has(from)) {
    waSessions.set(from, apiKey);
  }

  const agentRes = await fetch(`${process.env.NEXTAUTH_URL ?? process.env.AUTH_URL}/api/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey },
    body: JSON.stringify({ message }),
  });

  const agentData = await agentRes.json();
  const reply = agentData.reply ?? "Sorry, I couldn't process that.";

  return NextResponse.json({ reply });
}

export async function PUT(req: Request) {
  const config = await prisma.gatewayConfig.findFirst({ orderBy: { createdAt: "desc" } });
  if (!config) return NextResponse.json({ error: "No gateway config" }, { status: 404 });

  const secret = req.headers.get("x-gateway-secret");
  if (secret !== config.sharedSecret)
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });

  await prisma.gatewayConfig.update({
    where: { id: config.id },
    data: { isActive: true, connectedAt: new Date() },
  });

  return NextResponse.json({ ok: true, message: "Gateway connected successfully" });
}
