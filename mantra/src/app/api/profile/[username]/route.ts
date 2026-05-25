import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/lib/utils";

function formatStack(s: any, userId: string) {
  return {
    id: s.id,
    title: s.title,
    slug: s.slug,
    description: s.description,
    courseCode: s.courseCode ?? "",
    university: s.university ?? "",
    department: s.department ?? "",
    semester: s.semester ?? "",
    language: s.language ?? "PDF",
    isVerified: s.isVerified,
    views: s.views,
    stars: s._count?.stars ?? 0,
    forks: s._count?.forks ?? 0,
    discussions: s._count?.discussions ?? 0,
    tags: s.tags?.map((t: any) => t.tag?.name ?? t).filter(Boolean) ?? [],
    owner: s.owner ?? null,
    modules: s.modules ?? [],
    updatedDaysAgo: daysAgo(s.updatedAt),
    lastUpdated: s.updatedAt?.toISOString?.() ?? s.updatedAt,
    isStarred: s.stars?.some((st: any) => st.userId === userId) ?? false,
    isBookmarked: s.bookmarks?.some((b: any) => b.userId === userId) ?? false,
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  const session = await auth();
  const viewerId = session?.user?.id ?? "__none__";

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      university: true,
      department: true,
      level: true,
      isVerified: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          stacks: true,
          followers: true,
          following: true,
          stars: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const [stacks, starredStacks, isFollowing, contributedTo] = await Promise.all([
    prisma.stack.findMany({
      where: { ownerId: user.id, isPublic: true },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        owner: { select: { id: true, name: true, username: true, image: true } },
        tags: { include: { tag: true } },
        modules: { orderBy: { order: "asc" }, take: 5 },
        _count: { select: { stars: true, forks: true, discussions: true } },
        stars: { where: { userId: viewerId }, select: { userId: true } },
        bookmarks: { where: { userId: viewerId }, select: { userId: true } },
      },
    }),
    prisma.stackStar.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        stack: {
          include: {
            owner: { select: { id: true, name: true, username: true, image: true } },
            tags: { include: { tag: true } },
            modules: { orderBy: { order: "asc" }, take: 5 },
            _count: { select: { stars: true, forks: true, discussions: true } },
            stars: { where: { userId: viewerId }, select: { userId: true } },
            bookmarks: { where: { userId: viewerId }, select: { userId: true } },
          },
        },
      },
    }),
    viewerId !== "__none__"
      ? prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
        })
      : Promise.resolve(null),
    prisma.stackFork.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        stack: {
          include: {
            owner: { select: { id: true, name: true, username: true, image: true } },
            tags: { include: { tag: true } },
            modules: { orderBy: { order: "asc" }, take: 5 },
            _count: { select: { stars: true, forks: true, discussions: true } },
            stars: { where: { userId: viewerId }, select: { userId: true } },
            bookmarks: { where: { userId: viewerId }, select: { userId: true } },
          },
        },
      },
    }),
  ]);

  const totalStarsReceived = await prisma.stackStar.count({
    where: { stack: { ownerId: user.id } },
  });

  return NextResponse.json({
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      followers: user._count.followers,
      following: user._count.following,
      repositoryCount: user._count.stacks,
      starsReceived: totalStarsReceived,
    },
    stacks: stacks.map(s => formatStack(s, viewerId)),
    starredStacks: starredStacks.map(ss => formatStack(ss.stack, viewerId)),
    contributedStacks: contributedTo.map(f => formatStack(f.stack, viewerId)),
    isFollowing: !!isFollowing,
    isOwnProfile: viewerId === user.id,
  });
}
