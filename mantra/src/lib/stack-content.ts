import { prisma } from "@/lib/prisma";
import { decryptMtContent, EncryptedMtPacket } from "@/lib/mt-engine";

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
      take: 8,
      select: {
        rawContent: true,
        summary: true,
        concepts: true,
        sections: true,
        fileName: true,
        isEncrypted: true,
        encryptedData: true,
        encryptedIv: true,
        authTag: true,
      },
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

  const processedContents: {
    rawContent: string;
    summary: string | null;
    concepts: string[];
    fileName: string | null;
    sections: any[];
  }[] = mtContents.map(mt => {
    let sections: any[] = [];
    let concepts: string[] = Array.isArray(mt.concepts) ? (mt.concepts as string[]) : [];
    let summary: string | null = mt.summary;

    if (mt.isEncrypted && mt.encryptedData && mt.encryptedIv && mt.authTag) {
      try {
        const packet: EncryptedMtPacket = {
          version: "MT1",
          encryptedData: mt.encryptedData,
          iv: mt.encryptedIv,
          authTag: mt.authTag,
        };
        const decrypted = decryptMtContent(packet, stackId);
        sections = Array.isArray(decrypted.sections) ? decrypted.sections : [];
        if (Array.isArray(decrypted.concepts)) concepts = decrypted.concepts as string[];
        if (decrypted.summary) summary = decrypted.summary;
      } catch { /* fall through to rawContent */ }
    } else if (mt.sections) {
      sections = Array.isArray(mt.sections) ? (mt.sections as any[]) : [];
    }

    return {
      rawContent: mt.rawContent ?? "",
      summary,
      concepts,
      fileName: mt.fileName,
      sections,
    };
  });

  const allConcepts = processedContents.flatMap(mt => mt.concepts);
  const uniqueConcepts = [...new Set(allConcepts)];

  const sectionTexts = processedContents.flatMap(mt =>
    mt.sections
      .map((s: any) => {
        const heading = s.heading ?? s.title ?? "";
        const body = s.body ?? s.content ?? s.text ?? "";
        return heading && body ? `## ${heading}\n${body}` : body || heading;
      })
      .filter(Boolean)
  ).join("\n\n").slice(0, 12000);

  const rawChunks = processedContents
    .map(mt => mt.rawContent?.trim())
    .filter(Boolean)
    .join("\n\n---\n\n")
    .slice(0, sectionTexts.length > 200 ? 4000 : 8000);

  const summaries = processedContents
    .map(mt => mt.summary?.trim())
    .filter(Boolean)
    .join("\n");

  const fileNames = files.map(f => f.name);

  const richContext = [
    `Stack: ${stack.title}`,
    stack.courseCode ? `Course: ${stack.courseCode}` : "",
    stack.university ? `University: ${stack.university}` : "",
    stack.department ? `Department: ${stack.department}` : "",
    stack.semester ? `Semester: ${stack.semester}` : "",
    stack.description ? `Description: ${stack.description}` : "",
    tags.length ? `Topics: ${tags.join(", ")}` : "",
    stack.modules.length ? `Modules: ${stack.modules.map(m => `${m.title} (${m.type})`).join(", ")}` : "",
    stack.readme ? `README:\n${stack.readme.slice(0, 1000)}` : "",
    uniqueConcepts.length ? `Key concepts: ${uniqueConcepts.slice(0, 40).join(", ")}` : "",
    summaries ? `Content summaries:\n${summaries.slice(0, 1500)}` : "",
    sectionTexts ? `Structured content:\n${sectionTexts}` : "",
    rawChunks && !sectionTexts ? `Full content:\n${rawChunks}` : rawChunks ? `Additional raw content:\n${rawChunks}` : "",
    fileNames.length ? `Files: ${fileNames.join(", ")}` : "",
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
    mtContents: processedContents.map(mt => ({
      rawContent: mt.rawContent,
      summary: mt.summary,
      concepts: mt.concepts,
      fileName: mt.fileName,
    })),
    richContext,
  };
}
