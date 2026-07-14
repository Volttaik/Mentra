import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = 20;

  const where = q
    ? {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { owner: { username: { contains: q } } },
        ],
      }
    : {};

  const [stacks, total] = await Promise.all([
    prisma.stack.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        owner: { select: { id: true, name: true, username: true } },
        _count: { select: { stars: true, forks: true, discussions: true } },
      },
    }),
    prisma.stack.count({ where }),
  ]);

  return NextResponse.json({ stacks, total, page, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { stackId, action } = await req.json();
  if (!stackId || !action) {
    return NextResponse.json({ error: "Missing stackId or action" }, { status: 400 });
  }

  const stack = await prisma.stack.findUnique({ where: { id: stackId } });
  if (!stack) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "verify") {
    await prisma.stack.update({ where: { id: stackId }, data: { isVerified: !stack.isVerified } });
  } else if (action === "archive") {
    await prisma.stack.update({ where: { id: stackId }, data: { isArchived: !stack.isArchived } });
  } else if (action === "delete") {
    await prisma.stack.delete({ where: { id: stackId } });
  } else {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
