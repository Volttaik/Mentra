import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assembleStackContent } from "@/lib/stack-content";

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stack = await prisma.stack.findUnique({
    where: { slug: params.slug },
    select: { id: true, isPublic: true, ownerId: true, isArchived: true },
  });

  if (!stack) return NextResponse.json({ error: "Stack not found" }, { status: 404 });

  const isOwner = session.user.id === stack.ownerId;
  if (!stack.isPublic && !isOwner) {
    return NextResponse.json({ error: "Forbidden: you do not have access to this stack" }, { status: 403 });
  }
  if (stack.isArchived && !isOwner) {
    return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  }

  const content = await assembleStackContent(stack.id);
  if (!content) return NextResponse.json({ error: "Stack not found" }, { status: 404 });

  return NextResponse.json({
    title: content.title,
    description: content.description,
    courseCode: content.courseCode,
    university: content.university,
    department: content.department,
    semester: content.semester,
    tags: content.tags,
    modules: content.modules,
    files: content.files,
    concepts: [...new Set(content.mtContents.flatMap(mt => mt.concepts))],
    summaries: content.mtContents.map(mt => ({ fileName: mt.fileName, summary: mt.summary })).filter(mt => mt.summary),
    hasRawContent: content.mtContents.some(mt => !!mt.rawContent),
    richContext: content.richContext,
  });
}
