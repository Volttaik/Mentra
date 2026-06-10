import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

function formatStack(s: any, userId?: string) {
  return {
    id: s.id,
    title: s.title,
    slug: s.slug,
    description: s.description ?? "",
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
    isStarred: userId ? (s.stars?.some((st: any) => st.userId === userId) ?? false) : false,
    isBookmarked: userId ? (s.bookmarks?.some((b: any) => b.userId === userId) ?? false) : false,
  };
}

function formatUser(u: any) {
  return {
    id: u.id,
    name: u.name ?? "Unknown",
    username: u.username,
    university: u.university ?? "",
    department: u.department ?? "",
    bio: u.bio ?? undefined,
    followers: u._count?.followers ?? 0,
    repositories: u._count?.stacks ?? 0,
    contributions: u._count?.stars ?? 0,
    achievements: [] as string[],
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const type = searchParams.get("type") ?? "all";
  const sort = searchParams.get("sort") ?? "stacks";
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  if (type === "universities") {
    const rows = await prisma.stack.groupBy({
      by: ["university"],
      where: { isPublic: true, university: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 50,
    });
    const userRows = await prisma.user.groupBy({
      by: ["university"],
      where: { university: { not: null } },
      _count: { id: true },
    });
    const userMap: Record<string, number> = {};
    for (const r of userRows) {
      if (r.university) userMap[r.university] = r._count.id;
    }
    const universities = rows
      .filter(r => r.university)
      .map(r => ({
        name: r.university as string,
        stacks: r._count.id,
        learners: userMap[r.university as string] ?? 0,
      }));
    return NextResponse.json({ universities });
  }

  if (type === "users") {
    const orderBy: any =
      sort === "stacks"
        ? { stacks: { _count: "desc" } }
        : sort === "followers"
        ? { followers: { _count: "desc" } }
        : { createdAt: "desc" };

    const where: any = q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
            { university: { contains: q, mode: "insensitive" } },
            { department: { contains: q, mode: "insensitive" } },
          ],
        }
      : {};

    const users = await prisma.user.findMany({
      where: { ...where, bannedAt: null },
      orderBy,
      take: limit,
      select: {
        id: true,
        name: true,
        username: true,
        university: true,
        department: true,
        bio: true,
        image: true,
        isVerified: true,
        _count: { select: { stacks: true, followers: true, stars: true } },
      },
    });
    return NextResponse.json({ users: users.map(formatUser) });
  }

  if (type === "tags") {
    const where: any = q ? { name: { contains: q, mode: "insensitive" } } : {};
    const tags = await prisma.tag.findMany({
      where,
      orderBy: { stacks: { _count: "desc" } },
      take: limit,
      select: { name: true, _count: { select: { stacks: true } } },
    });
    return NextResponse.json({ tags: tags.map(t => ({ name: t.name, count: t._count.stacks })) });
  }

  if (type === "trending_tags") {
    const tags = await prisma.tag.findMany({
      orderBy: { stacks: { _count: "desc" } },
      take: 20,
      select: { name: true },
    });
    return NextResponse.json({ tags: tags.map(t => t.name) });
  }

  const stackWhere: any = {
    isPublic: true,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { courseCode: { contains: q, mode: "insensitive" } },
            { university: { contains: q, mode: "insensitive" } },
            { department: { contains: q, mode: "insensitive" } },
            { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
          ],
        }
      : {}),
  };

  const userWhere: any = q
    ? {
        bannedAt: null,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          { university: { contains: q, mode: "insensitive" } },
          { department: { contains: q, mode: "insensitive" } },
        ],
      }
    : { bannedAt: null };

  const tagWhere: any = q ? { name: { contains: q, mode: "insensitive" } } : {};

  const [stacks, users, tags] = await Promise.all([
    q
      ? prisma.stack.findMany({
          where: stackWhere,
          orderBy: { stars: { _count: "desc" } },
          take: limit,
          include: {
            owner: { select: { id: true, name: true, username: true, image: true } },
            tags: { include: { tag: true } },
            modules: { orderBy: { order: "asc" }, take: 5 },
            _count: { select: { stars: true, forks: true, discussions: true } },
            stars: userId ? { where: { userId }, select: { userId: true } } : false,
            bookmarks: userId ? { where: { userId }, select: { userId: true } } : false,
          },
        })
      : Promise.resolve([]),
    q
      ? prisma.user.findMany({
          where: userWhere,
          orderBy: { stacks: { _count: "desc" } },
          take: limit,
          select: {
            id: true, name: true, username: true, university: true,
            department: true, bio: true, image: true, isVerified: true,
            _count: { select: { stacks: true, followers: true, stars: true } },
          },
        })
      : Promise.resolve([]),
    q
      ? prisma.tag.findMany({
          where: tagWhere,
          orderBy: { stacks: { _count: "desc" } },
          take: 20,
          select: { name: true },
        })
      : prisma.tag.findMany({
          orderBy: { stacks: { _count: "desc" } },
          take: 20,
          select: { name: true },
        }),
  ]);

  return NextResponse.json({
    stacks: stacks.map(s => formatStack(s, userId)),
    users: users.map(formatUser),
    tags: tags.map(t => t.name),
  });
}
