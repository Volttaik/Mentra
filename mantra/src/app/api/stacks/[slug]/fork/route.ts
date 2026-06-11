import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { slug } = params;
  const userId = session.user.id;

  const original = await prisma.stack.findUnique({
    where: { slug },
    include: {
      tags: { include: { tag: true } },
      modules: { orderBy: { order: "asc" } },
      files: true,
    },
  });
  if (!original) return NextResponse.json({ error: "Stack not found" }, { status: 404 });

  const alreadyForked = await prisma.stackFork.findFirst({ where: { userId, stackId: original.id } });
  if (alreadyForked) {
    return NextResponse.json({ error: "Already forked" }, { status: 409 });
  }

  const forkTitle = `Fork of ${original.title}`;
  const baseSlug = slugify(forkTitle);
  let forkSlug = baseSlug;
  let collision = await prisma.stack.findFirst({ where: { slug: forkSlug } });
  let i = 2;
  while (collision) {
    forkSlug = `${baseSlug}-${i++}`;
    collision = await prisma.stack.findFirst({ where: { slug: forkSlug } });
  }

  const forkedStack = await prisma.stack.create({
    data: {
      title: forkTitle,
      slug: forkSlug,
      description: original.description,
      courseCode: original.courseCode,
      university: original.university,
      department: original.department,
      semester: original.semester,
      language: original.language,
      isPublic: true,
      readme: original.readme,
      banner: original.banner,
      profile: original.profile,
      ownerId: userId,
      forkedFromId: original.id,
    },
  });

  const oldToNewModuleId = new Map<string, string>();

  for (const m of original.modules) {
    const newModule = await prisma.module.create({
      data: {
        title: m.title,
        type: m.type,
        order: m.order,
        duration: m.duration,
        files: m.files,
        stackId: forkedStack.id,
      },
    });
    oldToNewModuleId.set(m.id, newModule.id);
  }

  for (const file of original.files) {
    await prisma.stackFile.create({
      data: {
        stackId: forkedStack.id,
        moduleId: file.moduleId ? (oldToNewModuleId.get(file.moduleId) ?? null) : null,
        name: file.name,
        url: file.url,
        rawPath: file.rawPath,
        size: file.size,
        mimeType: file.mimeType,
      },
    });
  }

  for (const stackTag of original.tags) {
    await prisma.stackTag.create({
      data: { stackId: forkedStack.id, tagId: stackTag.tagId },
    }).catch(() => {});
  }

  await prisma.stackFork.create({ data: { userId, stackId: original.id } });

  if (original.ownerId !== userId) {
    await prisma.notification.create({
      data: {
        userId: original.ownerId,
        type: "FORK",
        title: "New fork",
        body: `${session.user.name} forked your stack "${original.title}"`,
        link: `/stacks/${slug}`,
      },
    }).catch(() => {});
  }

  const count = await prisma.stackFork.count({ where: { stackId: original.id } });
  return NextResponse.json({ forked: true, count, forkSlug });
}
