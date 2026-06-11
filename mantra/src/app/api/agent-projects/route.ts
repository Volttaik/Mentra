import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const projects = await prisma.agentProject.findMany({
    where: { userId: session.user.id },
    include: { tasks: { orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { title, subject, deadline, status, priority, tasks } = body;
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const project = await prisma.agentProject.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      subject: subject || null,
      deadline: deadline ? new Date(deadline) : null,
      status: status || "todo",
      priority: priority || "medium",
      tasks: tasks?.length ? { create: tasks.map((t: string, i: number) => ({ label: t, order: i })) } : undefined,
    },
    include: { tasks: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(project, { status: 201 });
}
