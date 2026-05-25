import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; discussionId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { discussionId } = params;
  const body = await req.json();
  const { content } = body;

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 });
  }

  const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
  if (!discussion) return NextResponse.json({ error: "Discussion not found" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: {
      body: content.trim(),
      userId: session.user.id,
      discussionId,
    },
    include: {
      user: { select: { name: true, username: true, image: true } },
    },
  });

  return NextResponse.json({
    id: comment.id,
    body: comment.body,
    isAccepted: comment.isAccepted,
    author: comment.user,
    createdAt: comment.createdAt.toISOString(),
  }, { status: 201 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; discussionId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, discussionId } = params;
  const body = await req.json();
  const { resolved, commentId, accept } = body;

  const stack = await prisma.stack.findUnique({ where: { slug }, select: { id: true, ownerId: true } });
  if (!stack) return NextResponse.json({ error: "Stack not found" }, { status: 404 });

  const discussion = await prisma.discussion.findUnique({ where: { id: discussionId } });
  if (!discussion) return NextResponse.json({ error: "Discussion not found" }, { status: 404 });

  const isOwner = stack.ownerId === session.user.id || discussion.userId === session.user.id;

  if (resolved !== undefined && isOwner) {
    await prisma.discussion.update({
      where: { id: discussionId },
      data: { resolved: Boolean(resolved) },
    });
  }

  if (commentId && accept !== undefined && isOwner) {
    await prisma.comment.updateMany({
      where: { discussionId },
      data: { isAccepted: false },
    });
    if (accept) {
      await prisma.comment.update({
        where: { id: commentId },
        data: { isAccepted: true },
      });
      await prisma.discussion.update({
        where: { id: discussionId },
        data: { resolved: true },
      });
    }
  }

  return NextResponse.json({ success: true });
}
