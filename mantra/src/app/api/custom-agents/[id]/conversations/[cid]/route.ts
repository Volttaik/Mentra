import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string; cid: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const conv = await prisma.customAgentConversation.findFirst({
    where: { id: params.cid, agentId: params.id, userId: session.user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(conv);
}

export async function DELETE(_: Request, { params }: { params: { id: string; cid: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.customAgentConversation.deleteMany({
    where: { id: params.cid, agentId: params.id, userId: session.user.id },
  });
  return NextResponse.json({ deleted: true });
}
