import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const agent = await prisma.customAgent.findFirst({
    where: { id: params.id, ownerId: session.user.id },
    include: {
      knowledgeFiles: true,
      listing: true,
      _count: { select: { conversations: true, subscriptions: true } },
    },
  });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(agent);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const agent = await prisma.customAgent.updateMany({
    where: { id: params.id, ownerId: session.user.id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.subject && { subject: body.subject }),
      ...(body.level && { level: body.level }),
      ...(body.domain && { domain: body.domain }),
      ...(body.tone && { tone: body.tone }),
      ...(body.personality !== undefined && { personality: body.personality }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
      ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
    },
  });
  return NextResponse.json({ updated: agent.count > 0 });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.customAgent.deleteMany({ where: { id: params.id, ownerId: session.user.id } });
  return NextResponse.json({ deleted: true });
}
