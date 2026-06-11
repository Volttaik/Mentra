import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 12; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const codes = await (prisma as any).whatsAppAgentCode.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ codes });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { agentId } = await req.json();
  if (!agentId) return NextResponse.json({ error: "agentId required" }, { status: 400 });

  const agent = await prisma.customAgent.findFirst({
    where: { id: agentId, ownerId: session.user.id },
  });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  await (prisma as any).whatsAppAgentCode.deleteMany({
    where: { agentId, userId: session.user.id, used: false },
  });

  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
    const existing = await (prisma as any).whatsAppAgentCode.findUnique({ where: { code } });
    if (!existing) break;
  } while (attempts < 10);

  const record = await (prisma as any).whatsAppAgentCode.create({
    data: { code, agentId, userId: session.user.id },
  });

  return NextResponse.json({ code: record });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await (prisma as any).whatsAppAgentCode.deleteMany({
    where: { id: Number(id), userId: session.user.id },
  });

  return NextResponse.json({ deleted: true });
}
