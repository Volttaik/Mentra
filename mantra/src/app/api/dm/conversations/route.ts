import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function getMutualFollow(userId: string, targetId: string) {
  const [a, b] = await Promise.all([
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: userId, followingId: targetId } } }),
    prisma.follow.findUnique({ where: { followerId_followingId: { followerId: targetId, followingId: userId } } }),
  ]);
  return !!(a && b);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const convos = await prisma.directConversation.findMany({
    where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    orderBy: { lastMessageAt: "desc" },
    include: {
      user1: { select: { id: true, name: true, username: true, image: true, isVerified: true } },
      user2: { select: { id: true, name: true, username: true, image: true, isVerified: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, content: true, createdAt: true, senderId: true, deletedAt: true, isViewOnce: true, viewedAt: true },
      },
    },
  });

  const result = convos.map(c => {
    const otherUser = c.user1Id === userId ? c.user2 : c.user1;
    const lastMsg = c.messages[0] ?? null;
    return {
      id: c.id,
      otherUser,
      lastMessage: lastMsg
        ? {
            id: lastMsg.id,
            content: lastMsg.deletedAt ? "[deleted]" : lastMsg.isViewOnce ? "📷 View once" : lastMsg.content,
            createdAt: lastMsg.createdAt,
            senderId: lastMsg.senderId,
            isMine: lastMsg.senderId === userId,
          }
        : null,
      lastMessageAt: c.lastMessageAt,
    };
  });

  return NextResponse.json({ conversations: result });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 });
  if (targetUserId === userId) return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });

  const isMutual = await getMutualFollow(userId, targetUserId);
  if (!isMutual) return NextResponse.json({ error: "You must follow each other to message" }, { status: 403 });

  const [user1Id, user2Id] = [userId, targetUserId].sort();

  const existing = await prisma.directConversation.findUnique({
    where: { user1Id_user2Id: { user1Id, user2Id } },
    include: {
      user1: { select: { id: true, name: true, username: true, image: true, isVerified: true } },
      user2: { select: { id: true, name: true, username: true, image: true, isVerified: true } },
    },
  });

  if (existing) {
    const otherUser = existing.user1Id === userId ? existing.user2 : existing.user1;
    return NextResponse.json({ conversation: { ...existing, otherUser } });
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, name: true, username: true, image: true, isVerified: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const conversation = await prisma.directConversation.create({
    data: { user1Id, user2Id },
    include: {
      user1: { select: { id: true, name: true, username: true, image: true, isVerified: true } },
      user2: { select: { id: true, name: true, username: true, image: true, isVerified: true } },
    },
  });

  const otherUser = conversation.user1Id === userId ? conversation.user2 : conversation.user1;
  return NextResponse.json({ conversation: { ...conversation, otherUser } });
}
