import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const stack = await prisma.stack.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!stack) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tagged = await prisma.stackTaggedUser.findMany({
    where: { stackId: stack.id },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(tagged.map(t => ({
    id: t.id,
    userId: t.userId,
    name: t.user.name,
    username: t.user.username,
    image: t.user.image,
  })));
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stack = await prisma.stack.findUnique({
    where: { slug: params.slug },
    select: { id: true, ownerId: true },
  });
  if (!stack) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (stack.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 });

  const userToTag = await prisma.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true, image: true },
  });
  if (!userToTag) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (userToTag.id === session.user.id) {
    return NextResponse.json({ error: "Cannot tag yourself" }, { status: 400 });
  }

  const tagged = await prisma.stackTaggedUser.upsert({
    where: { stackId_userId: { stackId: stack.id, userId: userToTag.id } },
    create: { stackId: stack.id, userId: userToTag.id, taggedBy: session.user.id },
    update: {},
  });

  return NextResponse.json({
    id: tagged.id,
    userId: userToTag.id,
    name: userToTag.name,
    username: userToTag.username,
    image: userToTag.image,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stack = await prisma.stack.findUnique({
    where: { slug: params.slug },
    select: { id: true, ownerId: true },
  });
  if (!stack) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (stack.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  await prisma.stackTaggedUser.deleteMany({
    where: { stackId: stack.id, userId },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { query } = await req.json();
  if (!query || query.length < 2) return NextResponse.json([]);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { name: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, username: true, image: true },
    take: 8,
  });

  return NextResponse.json(users);
}
