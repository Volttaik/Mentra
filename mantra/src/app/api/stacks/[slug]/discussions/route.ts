import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "all";

  const stack = await prisma.stack.findUnique({ where: { slug }, select: { id: true } });
  if (!stack) return NextResponse.json({ error: "Stack not found" }, { status: 404 });

  const where: any = { stackId: stack.id };
  if (type === "question") where.type = "question";
  if (type === "discussion") where.type = "discussion";

  const discussions = await prisma.discussion.findMany({
    where,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      user: { select: { name: true, username: true, image: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { name: true, username: true, image: true } },
        },
      },
      _count: { select: { comments: true } },
    },
  });

  return NextResponse.json({
    discussions: discussions.map(d => ({
      id: d.id,
      title: d.title,
      body: d.body,
      type: d.type,
      resolved: d.resolved,
      isPinned: d.isPinned,
      author: d.user,
      replies: d._count.comments,
      comments: d.comments.map(c => ({
        id: c.id,
        body: c.body,
        isAccepted: c.isAccepted,
        author: c.user,
        createdAt: c.createdAt.toISOString(),
      })),
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = params;
  const payload = await req.json();
  const { title, body: bodyText, content, type = "discussion" } = payload;
  const discussionBody = bodyText ?? content ?? "";

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const stack = await prisma.stack.findUnique({ where: { slug }, select: { id: true, ownerId: true, title: true } });
  if (!stack) return NextResponse.json({ error: "Stack not found" }, { status: 404 });

  const discussion = await prisma.discussion.create({
    data: {
      title: title.trim(),
      body: discussionBody.trim(),
      type: type === "question" ? "question" : "discussion",
      userId: session.user.id,
      stackId: stack.id,
    },
    include: {
      user: { select: { name: true, username: true, image: true } },
    },
  });

  return NextResponse.json({
    id: discussion.id,
    title: discussion.title,
    body: discussion.body,
    type: discussion.type,
    resolved: discussion.resolved,
    author: discussion.user,
    createdAt: discussion.createdAt.toISOString(),
  }, { status: 201 });
}
