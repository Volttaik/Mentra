import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const moduleId = formData.get("moduleId") as string | null;

  const maxSize = 25 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File exceeds 25 MB limit" }, { status: 413 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", stack.id);
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeName), buffer);

  const url = `/uploads/${stack.id}/${safeName}`;

  const record = await prisma.stackFile.create({
    data: {
      stackId: stack.id,
      moduleId: moduleId ?? null,
      name: file.name,
      url,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
    },
  });

  if (moduleId) {
    await prisma.module.update({
      where: { id: moduleId },
      data: { files: { increment: 1 } },
    }).catch(() => {});
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
  if (!fileId) return NextResponse.json({ error: "Missing fileId" }, { status: 400 });

  const stack = await prisma.stack.findUnique({
    where: { slug: params.slug },
    select: { id: true, ownerId: true },
  });
  if (!stack) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (stack.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.stackFile.delete({ where: { id: fileId, stackId: stack.id } }).catch(() => {});
  return NextResponse.json({ success: true });
}
