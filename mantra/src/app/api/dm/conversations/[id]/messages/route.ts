import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function verifyAccess(convId: string, userId: string) {
  return prisma.directConversation.findFirst({
    where: { id: convId, OR: [{ user1Id: userId }, { user2Id: userId }] },
  });
}

const msgSelect = {
  id: true, conversationId: true, senderId: true, content: true,
  isViewOnce: true, viewedAt: true, editedAt: true, deletedAt: true,
  replyToId: true, createdAt: true,
  sender: { select: { id: true, name: true, username: true, image: true } },
  replyTo: {
    select: {
      id: true, content: true, deletedAt: true, isViewOnce: true,
      sender: { select: { id: true, name: true } },
    },
  },
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const convo = await verifyAccess(params.id, session.user.id);
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const before = req.nextUrl.searchParams.get("before");
  const messages = await prisma.directMessage.findMany({
    where: {
      conversationId: params.id,
      ...(before ? { createdAt: { lt: new Date(before) } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: msgSelect,
  });

  return NextResponse.json({ messages: messages.reverse(), hasMore: messages.length === 50 });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const convo = await verifyAccess(params.id, session.user.id);
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { content, replyToId, isViewOnce } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "content required" }, { status: 400 });

  const [message] = await prisma.$transaction([
    prisma.directMessage.create({
      data: {
        conversationId: params.id,
        senderId: session.user.id,
        content: content.trim(),
        replyToId: replyToId ?? null,
        isViewOnce: isViewOnce ?? false,
      },
      select: msgSelect,
    }),
    prisma.directConversation.update({
      where: { id: params.id },
      data: { lastMessageAt: new Date() },
    }),
  ]);

  const otherId = convo.user1Id === session.user.id ? convo.user2Id : convo.user1Id;
  const me = await prisma.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
  await prisma.notification.create({
    data: {
      userId: otherId,
      type: "DM",
      title: `${me?.name ?? "Someone"} sent you a message`,
      body: isViewOnce ? "📷 View once message" : content.trim().slice(0, 80),
      link: `/messages/${params.id}`,
    },
  }).catch(() => {});

  return NextResponse.json({ message });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const convo = await verifyAccess(params.id, session.user.id);
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { messageId, content } = await req.json();
  if (!messageId || !content?.trim()) return NextResponse.json({ error: "messageId and content required" }, { status: 400 });

  const msg = await prisma.directMessage.findFirst({
    where: { id: messageId, conversationId: params.id, senderId: session.user.id, deletedAt: null },
  });
  if (!msg) return NextResponse.json({ error: "Message not found or not yours" }, { status: 404 });

  const fifteenMin = 15 * 60 * 1000;
  if (Date.now() - msg.createdAt.getTime() > fifteenMin) {
    return NextResponse.json({ error: "Can only edit messages within 15 minutes" }, { status: 403 });
  }

  const updated = await prisma.directMessage.update({
    where: { id: messageId },
    data: { content: content.trim(), editedAt: new Date() },
    select: msgSelect,
  });

  return NextResponse.json({ message: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const convo = await verifyAccess(params.id, session.user.id);
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messageId = req.nextUrl.searchParams.get("messageId");
  if (!messageId) return NextResponse.json({ error: "messageId required" }, { status: 400 });

  const msg = await prisma.directMessage.findFirst({
    where: { id: messageId, conversationId: params.id, senderId: session.user.id, deletedAt: null },
  });
  if (!msg) return NextResponse.json({ error: "Message not found or not yours" }, { status: 404 });

  const updated = await prisma.directMessage.update({
    where: { id: messageId },
    data: { deletedAt: new Date(), content: "[deleted]" },
    select: msgSelect,
  });

  return NextResponse.json({ message: updated });
}
