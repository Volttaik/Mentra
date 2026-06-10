import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const flow = await prisma.stackFlow.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!flow) return NextResponse.json({ error: "Flow not found" }, { status: 404 });

  const { stackId } = await req.json();
  if (!stackId) return NextResponse.json({ error: "stackId required" }, { status: 400 });

  try {
    const item = await prisma.stackFlowItem.create({ data: { flowId: params.id, stackId } });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Already in this flow" }, { status: 409 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const flow = await prisma.stackFlow.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!flow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { stackId } = await req.json();
  await prisma.stackFlowItem.deleteMany({ where: { flowId: params.id, stackId } });
  return NextResponse.json({ ok: true });
}
