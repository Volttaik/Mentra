import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await prisma.community.findUnique({ where: { slug: params.slug } });
  if (!community) return NextResponse.json({ error: "Community not found" }, { status: 404 });

  const member = await prisma.communityMember.findFirst({
    where: { communityId: community.id, userId: session.user.id },
  });
  if (!member) return NextResponse.json({ error: "You are not a member of this community" }, { status: 403 });

  const { stackId } = await req.json();
  if (!stackId) return NextResponse.json({ error: "stackId required" }, { status: 400 });

  const stack = await prisma.stack.findFirst({ where: { id: stackId, ownerId: session.user.id } });
  if (!stack) return NextResponse.json({ error: "Stack not found or not yours" }, { status: 404 });

  try {
    const cs = await prisma.communityStack.create({
      data: { communityId: community.id, stackId, addedBy: session.user.id },
    });
    return NextResponse.json(cs, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Already in this community" }, { status: 409 });
  }
}

export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await prisma.community.findUnique({ where: { slug: params.slug } });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { stackId } = await req.json();

  const isAdmin = community.adminId === session.user.id;
  const isContributor = await prisma.communityStack.findFirst({
    where: { communityId: community.id, stackId, addedBy: session.user.id },
  });

  if (!isAdmin && !isContributor)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.communityStack.deleteMany({ where: { communityId: community.id, stackId } });
  return NextResponse.json({ ok: true });
}
