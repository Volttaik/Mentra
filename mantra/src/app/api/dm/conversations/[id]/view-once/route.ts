import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const convo = await prisma.directConversation.findFirst({
    where: { id: params.id, OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }] },
  });
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { messageId } = await req.json();
  if (!messageId) return NextResponse.json({ error: "messageId required" }, { status: 400 });

  const msg = await prisma.directMessage.findFirst({
    where: {
      id: messageId,
      conversationId: params.id,
      isViewOnce: true,
      viewedAt: null,
      senderId: { not: session.user.id },
    },
  });
  if (!msg) return NextResponse.json({ error: "Message not found or already viewed" }, { status: 404 });

  const updated = await prisma.directMessage.update({
    where: { id: messageId },
    data: { viewedAt: new Date() },
    select: {
      id: true, conversationId: true, senderId: true, content: true,
      isViewOnce: true, viewedAt: true, editedAt: true, deletedAt: true,
      replyToId: true, createdAt: true,
      sender: { select: { id: true, name: true, username: true, image: true } },
    },
  });

  return NextResponse.json({ message: updated });
}
