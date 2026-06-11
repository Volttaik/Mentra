import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sessions = await prisma.agentScheduleSession.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const s = await prisma.agentScheduleSession.create({
    data: {
      userId: session.user.id,
      title: body.title || "Study Session",
      subject: body.subject || null,
      date: new Date(body.date),
      duration: body.duration || 60,
      notes: body.notes || null,
      stackId: body.stackId || null,
    },
  });
  return NextResponse.json(s, { status: 201 });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  await prisma.agentScheduleSession.updateMany({
    where: { id: body.id, userId: session.user.id },
    data: { ...(body.completed !== undefined && { completed: body.completed }), ...(body.notes !== undefined && { notes: body.notes }) },
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  await prisma.agentScheduleSession.deleteMany({ where: { id: searchParams.get("id") || "", userId: session.user.id } });
  return NextResponse.json({ deleted: true });
}
