import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const hub = await prisma.knowledgeHub.findUnique({
    where: { id: params.id },
    include: {
      creator: { select: { name: true, username: true, image: true } },
      members: { include: { user: { select: { id: true, name: true, username: true, image: true } } } },
      stacks: { include: { stack: { select: { id: true, title: true, slug: true, banner: true, description: true, courseCode: true, university: true, stars: true } } } },
    },
  });
  if (!hub) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!hub.isPublic && !hub.members.some(m => m.userId === session?.user?.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json(hub);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.action === "join") {
    const hub = await prisma.knowledgeHub.findUnique({ where: { id: params.id }, select: { accessCost: true, creatorId: true } });
    if (!hub) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const existing = await prisma.knowledgeHubMember.findFirst({ where: { hubId: params.id, userId: session.user.id } });
    if (existing) return NextResponse.json({ message: "Already a member" });
    if (hub.accessCost > 0) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { aiCredits: true } });
      if (!user || user.aiCredits < hub.accessCost) return NextResponse.json({ error: "Not enough credits" }, { status: 402 });
      await prisma.user.update({ where: { id: session.user.id }, data: { aiCredits: { decrement: hub.accessCost } } });
    }
    const member = await prisma.knowledgeHubMember.create({ data: { hubId: params.id, userId: session.user.id } });
    return NextResponse.json(member, { status: 201 });
  }

  if (body.action === "add-stack") {
    await prisma.knowledgeHubStack.create({ data: { hubId: params.id, stackId: body.stackId } });
    return NextResponse.json({ success: true });
  }

  if (body.action === "remove-stack") {
    await prisma.knowledgeHubStack.deleteMany({ where: { hubId: params.id, stackId: body.stackId } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
