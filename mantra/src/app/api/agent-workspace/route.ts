import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = await prisma.agentWorkspaceItem.findMany({
    where: { userId: session.user.id },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const item = await prisma.agentWorkspaceItem.create({
    data: { userId: session.user.id, title: body.title || "Untitled", content: body.content || "", type: body.type || "note", pinned: body.pinned || false },
  });
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  await prisma.agentWorkspaceItem.updateMany({
    where: { id: body.id, userId: session.user.id },
    data: { ...(body.title !== undefined && { title: body.title }), ...(body.content !== undefined && { content: body.content }), ...(body.pinned !== undefined && { pinned: body.pinned }) },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  await prisma.agentWorkspaceItem.deleteMany({ where: { id: searchParams.get("id") || "", userId: session.user.id } });
  return NextResponse.json({ deleted: true });
}
