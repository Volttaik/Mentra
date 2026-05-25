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

  const existing = await prisma.bookmark.findUnique({
    where: { userId_stackId: { userId, stackId: stack.id } },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { userId_stackId: { userId, stackId: stack.id } } });
  } else {
    await prisma.bookmark.create({ data: { userId, stackId: stack.id } });
  }

  return NextResponse.json({ bookmarked: !existing });
}
