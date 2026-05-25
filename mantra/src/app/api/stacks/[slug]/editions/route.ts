import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  const stack = await prisma.stack.findUnique({
    where: { slug },
    select: { id: true, ownerId: true },
  });

  if (!stack) return NextResponse.json({ error: "Stack not found" }, { status: 404 });

  const editions = await prisma.edition.findMany({
    where: { stackId: stack.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { mtContent: true } },
    },
  });

  return NextResponse.json({
    editions: editions.map(e => ({
      id: e.id,
      version: e.version,
      changelog: e.changelog,
      editorId: e.editorId,
      contentCount: e._count.mtContent,
      createdAt: e.createdAt.toISOString(),
    })),
    ownerId: stack.ownerId,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = params;
  const body = await req.json();
  const { changelog, versionType = "minor" } = body;

  const stack = await prisma.stack.findUnique({
    where: { slug },
    include: { modules: true },
  });

  if (!stack || stack.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
  }

  const lastEdition = await prisma.edition.findFirst({
    where: { stackId: stack.id },
    orderBy: { createdAt: "desc" },
  });

  let nextVersion = "1.0";
  if (lastEdition) {
    const [major, minor] = lastEdition.version.split(".").map(Number);
    nextVersion = versionType === "major"
      ? `${major + 1}.0`
      : `${major}.${(minor ?? 0) + 1}`;
  }

  const edition = await prisma.edition.create({
    data: {
      stackId: stack.id,
      version: nextVersion,
      changelog: changelog || "Manual version snapshot",
      editorId: session.user.id,
      snapshot: {
        title: stack.title,
        description: stack.description,
        modules: stack.modules.map(m => ({ id: m.id, title: m.title, type: m.type })),
      } as any,
    },
  });

  return NextResponse.json({
    edition: { id: edition.id, version: edition.version, createdAt: edition.createdAt }
  }, { status: 201 });
}
