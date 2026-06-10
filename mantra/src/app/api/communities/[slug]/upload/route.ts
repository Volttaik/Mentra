import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, adminId: true },
  });
  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (community.adminId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = formData.get("type") as "profile" | "banner" | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
    }

    let url: string;

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import("@vercel/blob");
      const ext = file.name.split(".").pop() ?? "jpg";
      const id = randomBytes(8).toString("hex");
      const folder = type === "banner" ? "banners" : "profiles";
      const filename = `community-${folder}-${id}.${ext}`;
      const bytes = await file.arrayBuffer();
      const blob = await put(`uploads/communities/${filename}`, bytes, {
        access: "public",
        contentType: file.type,
      });
      url = blob.url;
    } else {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");
      url = `data:${file.type};base64,${base64}`;
    }

    if (type === "banner") {
      await prisma.community.update({
        where: { id: community.id },
        data: { banner: url },
      });
      return NextResponse.json({ banner: url });
    } else {
      await prisma.community.update({
        where: { id: community.id },
        data: { profile: url },
      });
      return NextResponse.json({ profile: url });
    }
  } catch (err) {
    console.error("Community upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
