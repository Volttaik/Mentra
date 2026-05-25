import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { transformToMt, parseTextContent } from "@/lib/mt-transform";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { stackId, content, fileName, fileType } = body;

    if (!stackId || !content) {
      return NextResponse.json({ error: "stackId and content are required" }, { status: 400 });
    }

    const stack = await prisma.stack.findUnique({ where: { id: stackId } });
    if (!stack || stack.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 403 });
    }

    const raw = parseTextContent(content);
    const mt = transformToMt(raw, fileName, fileType);

    const lastEdition = await prisma.edition.findFirst({
      where: { stackId },
      orderBy: { createdAt: "desc" },
    });

    let nextVersion = "1.0";
    if (lastEdition) {
      const [major, minor] = lastEdition.version.split(".").map(Number);
      nextVersion = `${major}.${(minor ?? 0) + 1}`;
    }

    const edition = await prisma.edition.create({
      data: {
        stackId,
        version: nextVersion,
        changelog: fileName ? `Uploaded: ${fileName}` : "Content added",
        snapshot: {
          title: stack.title,
          description: stack.description,
          modules: [],
        } as any,
        editorId: session.user.id,
        mtContent: {
          create: {
            stackId,
            rawContent: mt.rawContent,
            sections: mt.sections as any,
            concepts: mt.concepts as any,
            summary: mt.summary,
            references: mt.references as any,
            searchIndex: mt.searchIndex,
            fileName: mt.fileName,
            fileType: mt.fileType,
          },
        },
      },
      include: { mtContent: true },
    });

    await prisma.stack.update({
      where: { id: stackId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      editionId: edition.id,
      version: edition.version,
      mt: {
        summary: mt.summary,
        concepts: mt.concepts,
        sections: mt.sections.length,
        references: mt.references.length,
      },
    }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/content]", err);
    return NextResponse.json({ error: "Failed to process content" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const stackId = searchParams.get("stackId");
  const editionId = searchParams.get("editionId");

  if (!stackId) {
    return NextResponse.json({ error: "stackId required" }, { status: 400 });
  }

  const where = editionId ? { id: editionId, stackId } : { stackId };
  const edition = await prisma.edition.findFirst({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      mtContent: true,
    },
  });

  if (!edition) {
    return NextResponse.json({ edition: null, mtContent: [] });
  }

  return NextResponse.json({
    edition: {
      id: edition.id,
      version: edition.version,
      changelog: edition.changelog,
      createdAt: edition.createdAt,
    },
    mtContent: edition.mtContent.map(m => ({
      id: m.id,
      summary: m.summary,
      concepts: m.concepts,
      sections: m.sections,
      references: m.references,
      searchIndex: m.searchIndex,
      fileName: m.fileName,
      fileType: m.fileType,
    })),
  });
}
