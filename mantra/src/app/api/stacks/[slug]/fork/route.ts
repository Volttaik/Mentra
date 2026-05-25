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

  const stack = await prisma.stack.findUnique({ where: { slug }, select: { id: true, ownerId: true, title: true } });
  if (!stack) return NextResponse.json({ error: "Stack not found" }, { status: 404 });

  const alreadyForked = await prisma.stackFork.findFirst({ where: { userId, stackId: stack.id } });
  if (alreadyForked) {
    return NextResponse.json({ error: "Already forked" }, { status: 409 });
  }

  await prisma.stackFork.create({ data: { userId, stackId: stack.id } });

  // Notify owner
  if (stack.ownerId !== userId) {
    await prisma.notification.create({
      data: {
        userId: stack.ownerId,
        type: "FORK",
        title: "New fork",
        body: `${session.user.name} forked your stack "${stack.title}"`,
        link: `/stacks/${slug}`,
      },
    }).catch(() => {});
  }

  const count = await prisma.stackFork.count({ where: { stackId: stack.id } });
  return NextResponse.json({ forked: true, count });
}
