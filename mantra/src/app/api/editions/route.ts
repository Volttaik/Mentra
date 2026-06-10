import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stackId = searchParams.get("stackId");

  if (!stackId) {
    return NextResponse.json({ error: "stackId required" }, { status: 400 });
  }

  const editions = await prisma.edition.findMany({
    where: { stackId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { mtContent: true } },
    },
  });

  const stack = await prisma.stack.findUnique({
    where: { id: stackId },
    select: { ownerId: true },
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
    ownerId: stack?.ownerId,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { stackId, changelog, versionType = "minor" } = body;

  if (!stackId) {
    return NextResponse.json({ error: "stackId required" }, { status: 400 });
  }

  const stack = await prisma.stack.findUnique({
    where: { id: stackId },
    include: { modules: true },
  });

  if (!stack || stack.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
  }

  const lastEdition = await prisma.edition.findFirst({
    where: { stackId },
    orderBy: { createdAt: "desc" },
  });

  let nextVersion = "1.0";
  if (lastEdition) {
    const [major, minor] = lastEdition.version.split(".").map(Number);
    if (versionType === "major") {
      nextVersion = `${major + 1}.0`;
    } else {
      nextVersion = `${major}.${(minor ?? 0) + 1}`;
    }
  }

  const edition = await prisma.edition.create({
    data: {
      stackId,
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

  return NextResponse.json({ edition: { id: edition.id, version: edition.version } }, { status: 201 });
}
