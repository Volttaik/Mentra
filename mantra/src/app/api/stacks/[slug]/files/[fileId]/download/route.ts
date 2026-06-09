import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; fileId: string } }
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

  const fileRecord = await prisma.stackFile.findFirst({
    where: { id: params.fileId, stackId: stack.id },
  });
  if (!fileRecord) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  if (!fileRecord.rawPath) {
    return NextResponse.json({ error: "Not downloadable" }, { status: 400 });
  }

  const decoyUrl = fileRecord.rawPath + ".decoy";
  try {
    const blobRes = await fetch(decoyUrl);
    if (!blobRes.ok) {
      return NextResponse.json({ error: "File not available" }, { status: 404 });
    }
    const bytes = await blobRes.arrayBuffer();
    const decoyName = fileRecord.name.replace(/\.[^/.]+$/, "") + ".bin";
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(decoyName)}"`,
        "Cache-Control": "private, no-cache, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not available" }, { status: 404 });
  }
}
