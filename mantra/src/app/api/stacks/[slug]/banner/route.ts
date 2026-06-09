import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import { randomBytes } from "crypto";

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

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() ?? "jpg";
    const id = randomBytes(8).toString("hex");
    const filename = `banner-${id}.${ext}`;

    const bytes = await file.arrayBuffer();
    const blob = await put(`uploads/banners/${filename}`, bytes, {
      access: "public",
      contentType: file.type,
    });

    await prisma.stack.update({
      where: { id: stack.id },
      data: { banner: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Banner upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
