import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { readFile } from "fs/promises";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; fileId: string } }
) {
  const session = await auth();

  const stack = await prisma.stack.findUnique({
    where: { slug: params.slug },
    select: { id: true, isPublic: true, ownerId: true, isPaid: true },
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
    return NextResponse.json({ error: "No viewable content" }, { status: 404 });
  }

  try {
    const bytes = await readFile(fileRecord.rawPath);
    // Serve as octet-stream — prevents native browser PDF rendering.
    // The client fetches this as an ArrayBuffer and renders via PDF.js canvas.
    return new Response(bytes, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileRecord.name)}"`,
        "Cache-Control": "private, no-cache, no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not available" }, { status: 404 });
  }
}
