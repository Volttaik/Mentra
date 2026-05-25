import { NextResponse } from "next/server";
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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [user, myStacks, allNotifs, bookmarks, starsReceived, followerCount, stackCount] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, username: true, image: true, university: true, department: true, bio: true, createdAt: true },
      }),
      prisma.stack.findMany({
        where: { ownerId: userId },
        orderBy: { updatedAt: "desc" },
        take: 10,
        include: {
          owner: { select: { id: true, name: true, username: true, image: true } },
          tags: { include: { tag: true } },
          modules: { orderBy: { order: "asc" } },
          _count: { select: { stars: true, forks: true, discussions: true } },
          stars: { where: { userId }, select: { userId: true } },
          bookmarks: { where: { userId }, select: { userId: true } },
        },
      }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 15,
      }),
      prisma.bookmark.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          stack: {
            include: {
              owner: { select: { id: true, name: true, username: true, image: true } },
              tags: { include: { tag: true } },
              modules: { orderBy: { order: "asc" } },
              _count: { select: { stars: true, forks: true, discussions: true } },
              stars: { where: { userId }, select: { userId: true } },
              bookmarks: { where: { userId }, select: { userId: true } },
            },
          },
        },
      }),
      prisma.stackStar.count({ where: { stack: { ownerId: userId } } }),
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.stack.count({ where: { ownerId: userId } }),
    ]);

  const unreadCount = allNotifs.filter(n => !n.read).length;

  return NextResponse.json({
    user,
    myStacks: myStacks.map(s => formatStack(s, userId)),
    notifications: allNotifs.map(n => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
    bookmarks: bookmarks.map(b => formatStack(b.stack, userId)),
    stats: {
      stackCount,
      starsReceived,
      followerCount,
      totalViews: myStacks.reduce((acc, s) => acc + s.views, 0),
    },
  });
}
