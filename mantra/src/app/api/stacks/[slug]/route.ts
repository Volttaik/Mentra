import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { daysAgo, slugify } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;
  const session = await auth();
  const userId = session?.user?.id ?? "__none__";

  const [stack, latestEdition] = await Promise.all([
    prisma.stack.findUnique({
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
          include: { user: { select: { name: true, username: true, image: true } } },
        },
        _count: { select: { stars: true, forks: true, discussions: true } },
        stars: { where: { userId }, select: { userId: true } },
        bookmarks: { where: { userId }, select: { userId: true } },
        forks: {
          take: 10,
          include: { user: { select: { name: true, username: true, image: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.edition.findFirst({
      where: { stack: { slug } },
      orderBy: { createdAt: "desc" },
      include: {
        mtContent: {
          select: { id: true, summary: true, concepts: true, fileName: true, fileType: true },
          take: 1,
        },
      },
    }).catch(() => null),
  ]);

  if (!stack) {
    return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  }

  const isOwner = userId === stack.ownerId;
  if (!stack.isPublic && !isOwner) {
    return NextResponse.json({ error: "This stack is private" }, { status: 403 });
  }

  if (stack.isArchived && !isOwner) {
    return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  }

  prisma.stack.update({ where: { id: stack.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const latestMt = latestEdition?.mtContent?.[0] ?? null;

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
    isPaid: stack.isPaid ?? false,
    price: stack.price ?? null,
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
      createdAt: d.createdAt.toISOString(),
      author: d.user,
      replies: d._count.comments,
    })),
    contributors: stack.forks.map(f => f.user),
    updatedDaysAgo: daysAgo(stack.updatedAt),
    lastUpdated: stack.updatedAt.toISOString(),
    createdAt: stack.createdAt.toISOString(),
    banner: stack.banner ?? null,
    isStarred: stack.stars.some(s => s.userId === userId),
    isBookmarked: stack.bookmarks.some(b => b.userId === userId),
    latestMt: latestMt ? {
      id: latestMt.id,
      summary: latestMt.summary,
      concepts: latestMt.concepts,
      fileName: latestMt.fileName,
      fileType: latestMt.fileType,
    } : null,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stack = await prisma.stack.findUnique({ where: { slug: params.slug } });
  if (!stack) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = (session.user as any).role === "ADMIN";
  if (stack.ownerId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, courseCode, university, department, semester, language, isPublic, readme, tags, banner, profile, isPaid, price } = body;

  let newSlug = stack.slug;
  if (title && title !== stack.title) {
    const base = slugify(title);
    newSlug = base;
    let collision = await prisma.stack.findFirst({ where: { slug: newSlug, id: { not: stack.id } } });
    let i = 2;
    while (collision) {
      newSlug = `${base}-${i++}`;
      collision = await prisma.stack.findFirst({ where: { slug: newSlug, id: { not: stack.id } } });
    }
  }

  const updated = await prisma.stack.update({
    where: { id: stack.id },
    data: {
      ...(title && { title, slug: newSlug }),
      ...(description !== undefined && { description }),
      ...(courseCode !== undefined && { courseCode }),
      ...(university !== undefined && { university }),
      ...(department !== undefined && { department }),
      ...(semester !== undefined && { semester }),
      ...(language !== undefined && { language }),
      ...(isPublic !== undefined && { isPublic }),
      ...(readme !== undefined && { readme }),
      ...(banner !== undefined && { banner }),
      ...(profile !== undefined && { profile }),
      ...(isPaid !== undefined && { isPaid }),
      ...(price !== undefined && { price }),
    },
  });

  if (tags !== undefined) {
    await prisma.stackTag.deleteMany({ where: { stackId: stack.id } });
    for (const tagName of tags) {
      const tag = await prisma.tag.upsert({
        where: { name: tagName.toLowerCase().trim() },
        create: { name: tagName.toLowerCase().trim() },
        update: {},
      });
      await prisma.stackTag.create({ data: { stackId: stack.id, tagId: tag.id } }).catch(() => {});
    }
  }

  return NextResponse.json({ slug: updated.slug, success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stack = await prisma.stack.findUnique({ where: { slug: params.slug } });
  if (!stack) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = (session.user as any).role === "ADMIN";
  if (stack.ownerId !== session.user.id && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.stack.delete({ where: { id: stack.id } });
  return NextResponse.json({ success: true });
}
