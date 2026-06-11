import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Math.random().toString(36).slice(2, 6);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session = await auth();
  const mine = searchParams.get("mine") === "true";

  const where = mine && session?.user?.id
    ? { OR: [{ creatorId: session.user.id }, { members: { some: { userId: session.user.id } } }] }
    : { isPublic: true };

  const hubs = await prisma.knowledgeHub.findMany({
    where,
    include: {
      creator: { select: { name: true, username: true, image: true } },
      stacks: { include: { stack: { select: { id: true, title: true, slug: true, banner: true, description: true } } }, take: 4 },
      _count: { select: { members: true, stacks: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return NextResponse.json(hubs);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, description, domain, isPublic, accessCost } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const hub = await prisma.knowledgeHub.create({
    data: {
      slug: generateSlug(title.trim()),
      title: title.trim(),
      description: description || null,
      domain: domain || "general",
      isPublic: isPublic !== false,
      accessCost: accessCost || 0,
      creatorId: session.user.id,
      members: { create: { userId: session.user.id, role: "creator" } },
    },
    include: { creator: { select: { name: true, username: true } }, _count: { select: { members: true, stacks: true } } },
  });
  return NextResponse.json(hub, { status: 201 });
}
