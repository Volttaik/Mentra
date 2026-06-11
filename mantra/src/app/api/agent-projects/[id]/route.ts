import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  if (body.taskId !== undefined && body.done !== undefined) {
    await prisma.agentProjectTask.updateMany({ where: { id: body.taskId, project: { userId: session.user.id } }, data: { done: body.done } });
    return NextResponse.json({ success: true });
  }

  await prisma.agentProject.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: {
      ...(body.title && { title: body.title }),
      ...(body.status && { status: body.status }),
      ...(body.priority && { priority: body.priority }),
    },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.agentProject.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return NextResponse.json({ deleted: true });
}
