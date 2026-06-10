import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    keys: keys.map(k => ({
      id: k.id,
      name: k.name,
      keyPreview: k.key.slice(0, 8) + "..." + k.key.slice(-4),
      lastUsed: k.lastUsed?.toISOString() ?? null,
      requests: k.requests,
      isActive: k.isActive,
      createdAt: k.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Key name is required" }, { status: 400 });
  }

  const existingCount = await prisma.apiKey.count({ where: { userId: session.user.id } });
  if (existingCount >= 10) {
    return NextResponse.json({ error: "Maximum 10 API keys allowed" }, { status: 400 });
  }

  const rawKey = `mnt_${randomBytes(32).toString("hex")}`;

  const key = await prisma.apiKey.create({
    data: {
      userId: session.user.id,
      name: name.trim(),
      key: rawKey,
    },
  });

  return NextResponse.json({
    id: key.id,
    name: key.name,
    key: rawKey,
    createdAt: key.createdAt.toISOString(),
  }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Key ID required" }, { status: 400 });

  await prisma.apiKey.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
