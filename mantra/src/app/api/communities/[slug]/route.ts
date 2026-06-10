import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    include: {
      admin: { select: { id: true, name: true, username: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, username: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
      stacks: {
        orderBy: { addedAt: "desc" },
        include: {
          stack: {
            select: {
              id: true, title: true, slug: true, description: true, banner: true,
              language: true, isPaid: true,
              owner: { select: { name: true, username: true, image: true } },
              _count: { select: { stars: true } },
            },
          },
          contributor: { select: { name: true, username: true, image: true } },
        },
      },
      _count: { select: { members: true, stacks: true } },
    },
  });

  if (!community) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const myMembership = userId
    ? community.members.find(m => m.userId === userId) ?? null
    : null;

  return NextResponse.json({ ...community, myRole: myMembership?.role ?? null });
}

export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await prisma.community.findUnique({ where: { slug: params.slug } });
  if (!community || community.adminId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, description, banner, rules } = await req.json();
  const updated = await prisma.community.update({
    where: { slug: params.slug },
    data: { name, description, banner, rules },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const community = await prisma.community.findUnique({ where: { slug: params.slug } });
  if (!community || community.adminId !== session.user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.community.delete({ where: { slug: params.slug } });
  return NextResponse.json({ ok: true });
}
