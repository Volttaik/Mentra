import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversation = await prisma.agentConversation.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ conversation });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, addMessage } = await req.json().catch(() => ({}));

  const conversation = await prisma.agentConversation.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (addMessage) {
    const message = await prisma.agentMessage.create({
      data: {
        conversationId: params.id,
        role: addMessage.role,
        content: addMessage.content,
        imageUrl: addMessage.imageUrl ?? null,
      },
    });
    await prisma.agentConversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date(), ...(title ? { title } : {}) },
    });
    return NextResponse.json({ message });
  }

  if (title) {
    const updated = await prisma.agentConversation.update({
      where: { id: params.id },
      data: { title },
    });
    return NextResponse.json({ conversation: updated });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const conversation = await prisma.agentConversation.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.agentConversation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
