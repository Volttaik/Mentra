import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const flow = await prisma.stackFlow.findFirst({
    where: { id: params.id, userId: session.user.id },
    include: {
      items: {
        orderBy: { addedAt: "desc" },
        include: {
          stack: {
            select: {
              id: true, title: true, slug: true, description: true, banner: true,
              language: true, isPaid: true, price: true,
              owner: { select: { name: true, username: true, image: true } },
              _count: { select: { stars: true, files: true } },
            },
          },
        },
      },
      _count: { select: { items: true } },
    },
  });

  if (!flow) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(flow);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description, emoji } = await req.json();
  const flow = await prisma.stackFlow.updateMany({
    where: { id: params.id, userId: session.user.id },
    data: { name, description, emoji },
  });

  if (flow.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.stackFlow.deleteMany({ where: { id: params.id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
