import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const dynamic = "force-dynamic";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const files = await prisma.agentKnowledgeFile.findMany({
    where: { agent: { id: params.id, ownerId: session.user.id } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(files);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agent = await prisma.customAgent.findFirst({ where: { id: params.id, ownerId: session.user.id } });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const MAX = 10 * 1024 * 1024;
  if (file.size > MAX) return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 413 });

  const blob = await put(`agents/${params.id}/${Date.now()}-${file.name}`, file, { access: "public" });

  let content: string | null = null;
  if (file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".md")) {
    content = await file.text();
    if (content.length > 50000) content = content.slice(0, 50000);
  }

  const record = await prisma.agentKnowledgeFile.create({
    data: { agentId: params.id, name: file.name, url: blob.url, size: file.size, mimeType: file.type, content },
  });
  return NextResponse.json(record, { status: 201 });
}
