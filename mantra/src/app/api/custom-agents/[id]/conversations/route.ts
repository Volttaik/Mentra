import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const convs = await prisma.customAgentConversation.findMany({
    where: { agentId: params.id, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(convs);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await prisma.customAgent.findFirst({
    where: { id: params.id, OR: [{ ownerId: session.user.id }, { subscriptions: { some: { userId: session.user.id } } }] },
  });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const conv = await prisma.customAgentConversation.create({
    data: { agentId: params.id, userId: session.user.id, title: "New Chat" },
  });
  return NextResponse.json(conv, { status: 201 });
}
