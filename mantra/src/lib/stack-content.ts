import { prisma } from "@/lib/prisma";

export interface AssembledStackContent {
  id: string;
  title: string;
  description: string | null;
  courseCode: string | null;
  university: string | null;
  department: string | null;
  semester: string | null;
  readme: string | null;
  isPublic: boolean;
  ownerId: string;
  tags: string[];
  modules: { id: string; title: string; type: string; duration: string | null }[];
  files: { name: string; mimeType: string; size: number }[];
  mtContents: { rawContent: string; summary: string | null; concepts: string[]; fileName: string | null }[];
  richContext: string;
}

export async function assembleStackContent(stackId: string): Promise<AssembledStackContent | null> {
  const [stack, mtContents, files] = await Promise.all([
    prisma.stack.findUnique({
      where: { id: stackId },
      select: {
        id: true,
        title: true,
        description: true,
        courseCode: true,
        university: true,
        department: true,
        semester: true,
        readme: true,
        isPublic: true,
        ownerId: true,
        tags: { select: { tag: { select: { name: true } } } },
        modules: {
          orderBy: { order: "asc" },
          select: { id: true, title: true, type: true, duration: true },
        },
      },
    }),
    prisma.mtContent.findMany({
      where: { stackId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { rawContent: true, summary: true, concepts: true, fileName: true },
    }),
    prisma.stackFile.findMany({
      where: { stackId },
      orderBy: { createdAt: "asc" },
      take: 30,
      select: { name: true, mimeType: true, size: true },
    }),
  ]);

  if (!stack) return null;

  const tags = stack.tags.map((t: any) => t.tag.name);
  const concepts = mtContents.flatMap(mt =>
    Array.isArray(mt.concepts) ? (mt.concepts as string[]) : []
  );
  const uniqueConcepts = [...new Set(concepts)];

  const rawChunks = mtContents
    .map(mt => mt.rawContent?.trim())
    .filter(Boolean)
    .join("\n\n---\n\n")
    .slice(0, 8000);

  const summaries = mtContents
    .map(mt => mt.summary?.trim())
    .filter(Boolean)
    .join("\n");

  const richContext = [
    `Stack: ${stack.title}`,
    stack.courseCode ? `Course: ${stack.courseCode}` : "",
    stack.university ? `University: ${stack.university}` : "",
    stack.department ? `Department: ${stack.department}` : "",
    stack.semester ? `Semester: ${stack.semester}` : "",
    stack.description ? `Description: ${stack.description}` : "",
    tags.length ? `Topics: ${tags.join(", ")}` : "",
    stack.modules.length ? `Modules: ${stack.modules.map(m => `${m.title} (${m.type})`).join(", ")}` : "",
    stack.readme ? `README:\n${stack.readme.slice(0, 800)}` : "",
    uniqueConcepts.length ? `Key concepts: ${uniqueConcepts.slice(0, 30).join(", ")}` : "",
    summaries ? `Content summary:\n${summaries.slice(0, 1200)}` : "",
    rawChunks ? `Full content:\n${rawChunks}` : "",
    files.length ? `Files: ${files.map(f => f.name).join(", ")}` : "",
  ].filter(Boolean).join("\n\n");

  return {
    id: stack.id,
    title: stack.title,
    description: stack.description,
    courseCode: stack.courseCode,
    university: stack.university,
    department: stack.department,
    semester: stack.semester,
    readme: stack.readme,
    isPublic: stack.isPublic,
    ownerId: stack.ownerId,
    tags,
    modules: stack.modules,
    files,
    mtContents: mtContents.map(mt => ({
      rawContent: mt.rawContent,
      summary: mt.summary,
      concepts: Array.isArray(mt.concepts) ? (mt.concepts as string[]) : [],
      fileName: mt.fileName,
    })),
    richContext,
  };
}
