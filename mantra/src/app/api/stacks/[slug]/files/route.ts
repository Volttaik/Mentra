import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { extractTextFromFile, isTextExtractable } from "@/lib/mt-extractor";
import { buildAndEncryptMt } from "@/lib/mt-engine";

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

  const maxSize = 25 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File exceeds 25 MB limit" },
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
  const canExtract = isTextExtractable(mimeType, file.name);

  let fileUrl = "";
  let mtContentId: string | null = null;

  if (isMedia) {
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", stack.id);
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeName), buffer);
    fileUrl = `/uploads/${stack.id}/${safeName}`;
  } else if (canExtract) {
    fileUrl = "";

    let extractionError: string | null = null;
    try {
      const rawText = await extractTextFromFile(buffer, mimeType, file.name);
      if (!rawText || rawText.trim().length === 0) {
        extractionError = `No readable text could be extracted from "${file.name}". The file may be scanned, image-only, password-protected, or corrupted.`;
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
      if (msg.includes("password") || msg.includes("encrypted")) {
        extractionError = `"${file.name}" appears to be password-protected. Remove the password and re-upload.`;
      } else if (msg.includes("corrupt") || msg.includes("invalid") || msg.includes("Unexpected")) {
        extractionError = `"${file.name}" could not be read — the file may be corrupted or in an unsupported format.`;
      } else {
        extractionError = `Extraction failed for "${file.name}": ${msg.slice(0, 120)}`;
      }
    }

    if (extractionError) {
      return NextResponse.json({ error: extractionError }, { status: 422 });
    }
  } else {
    const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const uploadDir = path.join(
      process.cwd(),
      ".mt-storage",
      stack.id
    );
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, safeName), buffer);
    fileUrl = "";
  }

  const record = await prisma.stackFile.create({
    data: {
      stackId: stack.id,
      moduleId: moduleId ?? null,
      name: file.name,
      url: fileUrl,
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
    if (fileRecord.url?.startsWith("/uploads/")) {
      const diskPath = path.join(process.cwd(), "public", fileRecord.url);
      await unlink(diskPath).catch(() => {});
    }
  }
  return NextResponse.json({ success: true });
}
