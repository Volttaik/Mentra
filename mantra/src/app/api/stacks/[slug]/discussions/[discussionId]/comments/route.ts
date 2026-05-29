import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; discussionId: string } }
) {
  const comments = await prisma.comment.findMany({
    where: { discussionId: params.discussionId },
    orderBy: { createdAt: "asc" },
    include: {
      user: { select: { name: true, username: true, image: true } },
    },
  });

  return NextResponse.json({
    comments: comments.map(c => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
      author: c.user,
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string; discussionId: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { body } = await req.json();
  if (!body?.trim()) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  }

  const discussion = await prisma.discussion.findUnique({
    where: { id: params.discussionId },
    include: { stack: { select: { ownerId: true, slug: true, title: true } } },
  });
  if (!discussion) {
    return NextResponse.json({ error: "Discussion not found" }, { status: 404 });
  }

  const comment = await prisma.comment.create({
    data: {
      body: body.trim(),
      discussionId: params.discussionId,
      userId: session.user.id,
    },
    include: {
      user: { select: { name: true, username: true, image: true } },
    },
  });

  if (discussion.userId !== session.user.id) {
    await prisma.notification.create({
      data: {
        userId: discussion.userId,
        type: "COMMENT",
        title: "New reply on your discussion",
        body: `${session.user.name} replied to "${discussion.title}"`,
        link: `/stacks/${params.slug}#discussion-${params.discussionId}`,
      },
    }).catch(() => {});
  }

  return NextResponse.json({
    comment: {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      author: comment.user,
    },
  });
}
