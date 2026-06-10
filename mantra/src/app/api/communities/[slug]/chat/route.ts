import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await prisma.community.findUnique({ where: { slug: params.slug } });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.communityMember.findFirst({
    where: { communityId: community.id, userId: session.user.id },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const messages = await prisma.communityMessage.findMany({
    where: { communityId: community.id },
    orderBy: { createdAt: "asc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
    },
  });

  return NextResponse.json({ messages });
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await prisma.community.findUnique({ where: { slug: params.slug } });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.communityMember.findFirst({
    where: { communityId: community.id, userId: session.user.id },
  });
  if (!member) return NextResponse.json({ error: "Not a member" }, { status: 403 });

  const { content } = await req.json();
  if (!content?.trim()) return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });

  const message = await prisma.communityMessage.create({
    data: { communityId: community.id, userId: session.user.id, content: content.trim() },
    include: { user: { select: { id: true, name: true, username: true, image: true } } },
  });

  return NextResponse.json({ message }, { status: 201 });
}
