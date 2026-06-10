import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const flows = await prisma.stackFlow.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        take: 4,
        orderBy: { addedAt: "desc" },
        include: { stack: { select: { id: true, title: true, banner: true, slug: true } } },
      },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(flows);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, emoji } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const flow = await prisma.stackFlow.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      description: description?.trim() || null,
      emoji: emoji || "📚",
    },
  });

  return NextResponse.json(flow, { status: 201 });
}
