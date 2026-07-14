import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const type = req.nextUrl.searchParams.get("type") ?? "users";

  if (type === "stacks") {
    const stacks = await prisma.stack.findMany({
      where: {
        isPublic: true,
        ...(q ? { OR: [
          { title: { contains: q } },
          { slug: { contains: q } },
        ]} : {}),
      },
      select: { id: true, title: true, slug: true, banner: true, description: true },
      take: 8,
    });
    return NextResponse.json({ stacks });
  }

  if (type === "communities") {
    const memberships = await prisma.communityMember.findMany({
      where: { userId },
      include: {
        community: {
          select: { id: true, name: true, slug: true, profile: true },
        },
      },
    });
    const communities = memberships
      .map(m => m.community)
      .filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()));
    return NextResponse.json({ communities });
  }

  if (type === "quizzes") {
    const quizzes = await prisma.quiz.findMany({
      where: {
        ...(q ? { title: { contains: q } } : {}),
        stack: { isPublic: true },
      },
      select: { id: true, title: true, stack: { select: { title: true, slug: true } } },
      take: 8,
    });
    return NextResponse.json({ quizzes });
  }

  // Default: mutual follows search
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map(f => f.followingId);

  const mutualFollowers = await prisma.follow.findMany({
    where: { followerId: { in: followingIds }, followingId: userId },
    select: { followerId: true },
  });
  const mutualIds = mutualFollowers.map(f => f.followerId);

  const users = await prisma.user.findMany({
    where: {
      id: { in: mutualIds },
      ...(q ? { OR: [
        { name: { contains: q } },
        { username: { contains: q } },
      ]} : {}),
    },
    select: { id: true, name: true, username: true, image: true, isVerified: true, university: true },
    take: 10,
  });

  return NextResponse.json({ users });
}
