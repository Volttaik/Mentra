import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = await params;
  const userId = session.user.id;

  const stack = await prisma.stack.findUnique({ where: { slug }, select: { id: true } });
  if (!stack) return NextResponse.json({ error: "Stack not found" }, { status: 404 });

  const existing = await prisma.stackStar.findUnique({
    where: { userId_stackId: { userId, stackId: stack.id } },
  });

  if (existing) {
    await prisma.stackStar.delete({ where: { userId_stackId: { userId, stackId: stack.id } } });
  } else {
    await prisma.stackStar.create({ data: { userId, stackId: stack.id } });
    // Notify stack owner
    const stackWithOwner = await prisma.stack.findUnique({ where: { id: stack.id }, select: { ownerId: true, title: true } });
    if (stackWithOwner && stackWithOwner.ownerId !== userId) {
      await prisma.notification.create({
        data: {
          userId: stackWithOwner.ownerId,
          type: "STAR",
          title: "New star",
          body: `${session.user.name} starred your stack "${stackWithOwner.title}"`,
          link: `/stacks/${slug}`,
        },
      }).catch(() => {});
    }
  }

  const count = await prisma.stackStar.count({ where: { stackId: stack.id } });
  return NextResponse.json({ starred: !existing, count });
}
