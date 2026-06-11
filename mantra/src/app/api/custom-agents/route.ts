import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agents = await prisma.customAgent.findMany({
    where: { ownerId: session.user.id },
    include: {
      knowledgeFiles: { select: { id: true, name: true, size: true, mimeType: true, createdAt: true } },
      _count: { select: { conversations: true } },
      listing: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(agents);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { name, subject, level, domain, tone, personality, description } = body;
  if (!name?.trim() || !subject?.trim()) return NextResponse.json({ error: "Name and subject required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { aiCredits: true } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const existingCount = await prisma.customAgent.count({ where: { ownerId: session.user.id } });
  const COST = existingCount === 0 ? 0 : 100;
  if (COST > 0 && user.aiCredits < COST) {
    return NextResponse.json({ error: `Not enough credits. Need ${COST}, have ${user.aiCredits}.` }, { status: 402 });
  }

  const agent = await prisma.$transaction(async (tx) => {
    if (COST > 0) {
      await tx.user.update({ where: { id: session.user.id }, data: { aiCredits: { decrement: COST } } });
      await tx.creditTransaction.create({
        data: { userId: session.user.id, amount: -COST, type: "AGENT_CREATE", description: `Created agent: ${name}` },
      });
    }
    return tx.customAgent.create({
      data: { ownerId: session.user.id, name: name.trim(), subject: subject.trim(), level: level || "Undergraduate", domain: domain || "education", tone: tone || "patient", personality: personality || null, description: description || null },
    });
  });

  return NextResponse.json(agent, { status: 201 });
}
