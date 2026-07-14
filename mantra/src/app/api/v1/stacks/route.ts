import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function validateApiKey(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const key = authHeader.slice(7);
  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    include: { user: { select: { id: true } } },
  });

  if (!apiKey || !apiKey.isActive) return null;

  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsed: new Date(), requests: { increment: 1 } },
  }).catch(() => {});

  return apiKey.user;
}

export async function GET(req: NextRequest) {
  const user = await validateApiKey(req);
  if (!user) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "20"));

  if (slug) {
    const stack = await prisma.stack.findUnique({
      where: { slug },
      include: {
        owner: { select: { name: true, username: true } },
        tags: { include: { tag: true } },
        modules: { orderBy: { order: "asc" } },
        _count: { select: { stars: true, forks: true } },
      },
    });
    if (!stack || (!stack.isPublic && stack.ownerId !== user.id)) {
      return NextResponse.json({ error: "Stack not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: stack.id, title: stack.title, slug: stack.slug,
      description: stack.description, stars: stack._count.stars,
      forks: stack._count.forks, views: stack.views,
      tags: stack.tags.map(t => t.tag.name),
      owner: stack.owner, modules: stack.modules,
      createdAt: stack.createdAt, updatedAt: stack.updatedAt,
    });
  }

  const where: any = { isPublic: true };
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ];
  }

  const [stacks, total] = await Promise.all([
    prisma.stack.findMany({
      where, skip: (page - 1) * limit, take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { name: true, username: true } },
        tags: { include: { tag: true } },
        _count: { select: { stars: true, forks: true } },
      },
    }),
    prisma.stack.count({ where }),
  ]);

  return NextResponse.json({
    stacks: stacks.map(s => ({
      id: s.id, title: s.title, slug: s.slug, description: s.description,
      stars: s._count.stars, forks: s._count.forks, views: s.views,
      tags: s.tags.map(t => t.tag.name), owner: s.owner,
      createdAt: s.createdAt, updatedAt: s.updatedAt,
    })),
    total, page, pages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const user = await validateApiKey(req);
  if (!user) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  const body = await req.json();
  const { title, description, department, courseCode, university, semester, tags, isPublic } = body;

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: "Title and description required" }, { status: 400 });
  }

  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    + "-" + Math.random().toString(36).slice(2, 7);
  let slug = baseSlug;
  let collision = await prisma.stack.findFirst({ where: { slug } });
  let attempt = 0;
  while (collision && attempt < 5) {
    slug = baseSlug + "-" + Math.random().toString(36).slice(2, 5);
    collision = await prisma.stack.findFirst({ where: { slug } });
    attempt++;
  }

  const stack = await prisma.stack.create({
    data: {
      title: title.trim(), slug, description: description.trim(),
      courseCode: courseCode || null, university: university || null,
      department: department || null, semester: semester || null,
      isPublic: isPublic !== false, ownerId: user.id,
      tags: {
        create: (tags as string[] ?? []).filter(Boolean).map(name => ({
          tag: {
            connectOrCreate: {
              where: { name: name.toLowerCase().trim() },
              create: { name: name.toLowerCase().trim() },
            },
          },
        })),
      },
    },
  });

  return NextResponse.json({ id: stack.id, slug: stack.slug }, { status: 201 });
}
