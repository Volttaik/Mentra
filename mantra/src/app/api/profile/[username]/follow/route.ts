import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { username } = await params;
  const followerId = session.user.id;

  const target = await prisma.user.findUnique({ where: { username }, select: { id: true, name: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.id === followerId) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: target.id } },
  });

  if (existing) {
    await prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId: target.id } } });
  } else {
    await prisma.follow.create({ data: { followerId, followingId: target.id } });
    await prisma.notification.create({
      data: {
        userId: target.id,
        type: "FOLLOW",
        title: "New follower",
        body: `${session.user.name} started following you`,
        link: `/profile/${session.user.username}`,
      },
    }).catch(() => {});
  }

  const followerCount = await prisma.follow.count({ where: { followingId: target.id } });
  return NextResponse.json({ following: !existing, followerCount });
}
