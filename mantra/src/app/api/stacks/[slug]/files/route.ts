import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";
import { extractTextFromFile } from "@/lib/mt-extractor";
import { buildAndEncryptMt } from "@/lib/mt-engine";
import { randomBytes } from "crypto";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/msword",
  "application/vnd.ms-excel",
  "application/octet-stream",
  "text/plain",
  "text/markdown",
  "text/csv",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "video/mp4",
  "video/webm",
]);

const BLOCKED_EXTENSIONS =
  /\.(html?|svg|php|sh|exe|bat|cmd|js|mjs|ts|jsx|tsx|py|rb|go|java|c|cpp)$/i;

const MEDIA_MIMES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "video/mp4",
  "video/webm",
]);

const PDF_MIMES = new Set([
  "application/pdf",
]);

function generateDecoy(): Buffer {
  const header = "MENTRA-SECURED-CONTENT-v1\n";
  const lines: string[] = [header];
  for (let i = 0; i < 120; i++) {
    lines.push(randomBytes(32).toString("base64") + "\n");
  }
  lines.push("END-MENTRA-SECURED-CONTENT\n");
  return Buffer.from(lines.join(""), "utf8");
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  const stack = await prisma.stack.findUnique({
    where: { slug: params.slug },
    select: { id: true, isPublic: true, ownerId: true },
  });
  if (!stack) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = session?.user?.id === stack.ownerId;
  if (!stack.isPublic && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get("moduleId");

  const files = await prisma.stackFile.findMany({
    where: { stackId: stack.id, ...(moduleId ? { moduleId } : {}) },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ files });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stack = await prisma.stack.findUnique({
    where: { slug: params.slug },
    select: { id: true, ownerId: true },
  });
  if (!stack) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (stack.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const moduleId = formData.get("moduleId") as string | null;
  const displayName = (formData.get("displayName") as string | null)?.trim() || null;

  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File exceeds 50 MB limit" },
      { status: 413 }
    );
  }

  if (BLOCKED_EXTENSIONS.test(file.name)) {
    return NextResponse.json(
      { error: "File type not allowed" },
      { status: 415 }
    );
  }

  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_MIME_TYPES.has(mimeType) && !mimeType.startsWith("text/")) {
    return NextResponse.json(
      { error: "File type not allowed" },
      { status: 415 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const isMedia = MEDIA_MIMES.has(mimeType);
  const isPdf = PDF_MIMES.has(mimeType) || file.name.toLowerCase().endsWith(".pdf");
  const isText = mimeType.startsWith("text/") || ["text/plain", "text/markdown"].includes(mimeType);
  const isDocx = mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.toLowerCase().endsWith(".docx");

  let fileUrl = "";
  let rawPath: string | null = null;
  let mtContentId: string | null = null;

  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

  if (isMedia) {
    const blob = await put(`uploads/${stack.id}/${safeName}`, buffer, {
      access: "public",
      contentType: mimeType,
    });
    fileUrl = blob.url;
  } else if (isPdf) {
    const blob = await put(`mt-storage/${stack.id}/${safeName}`, buffer, {
      access: "public",
      contentType: "application/octet-stream",
    });
    rawPath = blob.url;

    const decoy = generateDecoy();
    await put(`mt-storage/${stack.id}/${safeName}.decoy`, decoy, {
      access: "public",
      contentType: "application/octet-stream",
    });
    fileUrl = "";
  } else if (isDocx || isText) {
    let extractionError: string | null = null;
    try {
      const rawText = await extractTextFromFile(buffer, mimeType, file.name);
      if (!rawText || rawText.trim().length === 0) {
        extractionError = `No readable text could be extracted from "${file.name}".`;
      } else {
        const { mt, packet } = buildAndEncryptMt(rawText, stack.id, file.name, mimeType);

        const lastEdition = await prisma.edition.findFirst({
          where: { stackId: stack.id },
          orderBy: { createdAt: "desc" },
        });

        let nextVersion = "1.0";
        if (lastEdition) {
          const [major, minor] = lastEdition.version.split(".").map(Number);
          nextVersion = `${major}.${(minor ?? 0) + 1}`;
        }

        const edition = await prisma.edition.create({
          data: {
            stackId: stack.id,
            version: nextVersion,
            changelog: `Uploaded: ${file.name}`,
            snapshot: { title: stack.id, source: file.name },
            editorId: session.user.id,
            mtContent: {
              create: {
                stackId: stack.id,
                rawContent: "",
                sections: mt.sections as any,
                concepts: mt.concepts as any,
                summary: mt.summary,
                references: mt.references as any,
                searchIndex: mt.searchIndex,
                fileName: file.name,
                fileType: mimeType,
                encryptedData: packet.encryptedData,
                encryptedIv: packet.iv,
                authTag: packet.authTag,
                isEncrypted: true,
              },
            },
          },
          include: { mtContent: true },
        });

        mtContentId = edition.mtContent[0]?.id ?? null;
      }
    } catch (extractErr: any) {
      console.error("[MT Pipeline] Extraction failed:", extractErr);
      const msg = extractErr?.message ?? String(extractErr);
      extractionError = `Extraction failed for "${file.name}": ${msg.slice(0, 120)}`;
    }

    if (extractionError) {
      return NextResponse.json({ error: extractionError }, { status: 422 });
    }
  } else {
    await put(`mt-storage/${stack.id}/${safeName}`, buffer, {
      access: "public",
      contentType: "application/octet-stream",
    });
  }

  const record = await prisma.stackFile.create({
    data: {
      stackId: stack.id,
      moduleId: moduleId ?? null,
      name: displayName ?? file.name,
      url: fileUrl,
      rawPath: rawPath ?? null,
      size: file.size,
      mimeType: mimeType,
      mtContentId: mtContentId ?? null,
    },
  });

  if (moduleId) {
    await prisma.module
      .update({
        where: { id: moduleId },
        data: { files: { increment: 1 } },
      })
      .catch(() => {});
  }

  return NextResponse.json({ file: record });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId");
  if (!fileId)
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });

  const stack = await prisma.stack.findUnique({
    where: { slug: params.slug },
    select: { id: true, ownerId: true },
  });
  if (!stack) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (stack.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fileRecord = await prisma.stackFile.findFirst({
    where: { id: fileId, stackId: stack.id },
  });
  if (fileRecord) {
    await prisma.stackFile.delete({ where: { id: fileId } }).catch(() => {});
    if (fileRecord.url && fileRecord.url.startsWith("https://")) {
      await del(fileRecord.url).catch(() => {});
    }
    if (fileRecord.rawPath && fileRecord.rawPath.startsWith("https://")) {
      await del(fileRecord.rawPath).catch(() => {});
      await del(fileRecord.rawPath + ".decoy").catch(() => {});
    }
  }
  return NextResponse.json({ success: true });
}
