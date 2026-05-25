import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { daysAgo, slugify } from "@/lib/utils";

function formatStack(s: any, userId?: string) {
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
    isPublic: s.isPublic,
    views: s.views,
    stars: s._count?.stars ?? 0,
    forks: s._count?.forks ?? 0,
    discussions: s._count?.discussions ?? 0,
    tags: s.tags?.map((t: any) => t.tag?.name ?? t).filter(Boolean) ?? [],
    owner: s.owner ?? null,
    modules: s.modules ?? [],
    updatedDaysAgo: daysAgo(s.updatedAt),
    lastUpdated: s.updatedAt?.toISOString?.() ?? s.updatedAt,
    createdAt: s.createdAt?.toISOString?.() ?? s.createdAt,
    isStarred: userId ? (s.stars?.some((st: any) => st.userId === userId) ?? false) : false,
    isBookmarked: userId ? (s.bookmarks?.some((b: any) => b.userId === userId) ?? false) : false,
    readme: s.readme ?? null,
  };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? "__none__";
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const department = searchParams.get("department") ?? "";
  const sort = searchParams.get("sort") ?? "trending";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = 20;

  const where: any = {
    isPublic: true,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { courseCode: { contains: q, mode: "insensitive" } },
            { university: { contains: q, mode: "insensitive" } },
            { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
          ],
        }
      : {}),
    ...(department && department !== "All" ? { department } : {}),
  };

  const orderBy: any =
    sort === "stars"
      ? { stars: { _count: "desc" } }
      : sort === "recent"
      ? { updatedAt: "desc" }
      : sort === "views"
      ? { views: "desc" }
      : { createdAt: "desc" };

  const [stacks, total] = await Promise.all([
    prisma.stack.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        owner: { select: { id: true, name: true, username: true, image: true } },
        tags: { include: { tag: true } },
        modules: { orderBy: { order: "asc" }, take: 10 },
        _count: { select: { stars: true, forks: true, discussions: true } },
        stars: { where: { userId }, select: { userId: true } },
        bookmarks: { where: { userId }, select: { userId: true } },
      },
    }),
    prisma.stack.count({ where }),
  ]);

  return NextResponse.json({
    stacks: stacks.map(s => formatStack(s, session?.user?.id)),
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { title, description, department, courseCode, university, semester, language, tags, modules, isPublic } = body;

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Title and description are required." }, { status: 400 });
    }

    const baseSlug = slugify(title);
    let slug = baseSlug;
    let attempt = 0;
    while (await prisma.stack.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    const stack = await prisma.stack.create({
      data: {
        title: title.trim(),
        slug,
        description: description.trim(),
        courseCode: courseCode?.trim() || null,
        university: university?.trim() || null,
        department: department?.trim() || null,
        semester: semester?.trim() || null,
        language: language || "PDF",
        isPublic: isPublic !== false,
        ownerId: session.user.id,
        tags: {
          create: (tags as string[] ?? [])
            .filter(Boolean)
            .map(name => ({
              tag: {
                connectOrCreate: {
                  where: { name: name.toLowerCase().trim() },
                  create: { name: name.toLowerCase().trim() },
                },
              },
            })),
        },
        modules: {
          create: (modules as { title: string; type: string }[] ?? [])
            .filter(m => m.title?.trim())
            .map((m, i) => ({
              title: m.title.trim(),
              type: m.type || "lecture",
              order: i,
            })),
        },
      },
    });

    return NextResponse.json({ slug: stack.slug, id: stack.id }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/stacks]", err);
    return NextResponse.json({ error: "Failed to create stack." }, { status: 500 });
  }
}
