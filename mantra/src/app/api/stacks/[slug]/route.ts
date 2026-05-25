import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? "__none__";

  const stack = await prisma.stack.findUnique({
    where: { slug },
    include: {
      owner: { select: { id: true, name: true, username: true, image: true, university: true, department: true } },
      tags: { include: { tag: true } },
      modules: { orderBy: { order: "asc" } },
      discussions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: { select: { name: true, username: true, image: true } },
          _count: { select: { comments: true } },
        },
      },
      contributions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          user: { select: { name: true, username: true, image: true } },
        },
      },
      _count: { select: { stars: true, forks: true, discussions: true } },
      stars: { where: { userId }, select: { userId: true } },
      bookmarks: { where: { userId }, select: { userId: true } },
      forks: {
        take: 10,
        include: {
          user: { select: { name: true, username: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!stack) {
    return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  }

  // Increment view count (fire and forget)
  prisma.stack.update({ where: { id: stack.id }, data: { views: { increment: 1 } } }).catch(() => {});

  return NextResponse.json({
    id: stack.id,
    title: stack.title,
    slug: stack.slug,
    description: stack.description,
    courseCode: stack.courseCode ?? "",
    university: stack.university ?? "",
    department: stack.department ?? "",
    semester: stack.semester ?? "",
    language: stack.language,
    isVerified: stack.isVerified,
    isPublic: stack.isPublic,
    views: stack.views,
    readme: stack.readme,
    stars: stack._count.stars,
    forks: stack._count.forks,
    discussions: stack._count.discussions,
    tags: stack.tags.map(t => t.tag.name),
    owner: stack.owner,
    modules: stack.modules,
    discussionsList: stack.discussions.map(d => ({
      id: d.id,
      title: d.title,
      body: d.body,
      resolved: d.resolved,
      createdAt: d.createdAt,
      author: d.user,
      replies: d._count.comments,
    })),
    contributors: stack.forks.map(f => f.user),
    updatedDaysAgo: daysAgo(stack.updatedAt),
    lastUpdated: stack.updatedAt.toISOString(),
    createdAt: stack.createdAt.toISOString(),
    isStarred: stack.stars.some(s => s.userId === userId),
    isBookmarked: stack.bookmarks.some(b => b.userId === userId),
  });
}
