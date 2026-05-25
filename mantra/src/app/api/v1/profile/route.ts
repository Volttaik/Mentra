import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function validateApiKey(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const key = authHeader.slice(7);
  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    include: { user: { select: { id: true } } },
  });
  if (!apiKey || !apiKey.isActive) return null;
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsed: new Date(), requests: { increment: 1 } },
  }).catch(() => {});
  return apiKey.user;
}

export async function GET(req: NextRequest) {
  const user = await validateApiKey(req);
  if (!user) return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, name: true, username: true, email: true,
      bio: true, university: true, department: true, level: true,
      isVerified: true, role: true, createdAt: true,
      _count: { select: { stacks: true, followers: true, following: true } },
    },
  });

  if (!profile) return NextResponse.json({ error: "User not found" }, { status: 404 });

  return NextResponse.json({
    id: profile.id, name: profile.name, username: profile.username,
    bio: profile.bio, university: profile.university, department: profile.department,
    level: profile.level, isVerified: profile.isVerified, role: profile.role,
    stacks: profile._count.stacks, followers: profile._count.followers,
    following: profile._count.following, createdAt: profile.createdAt,
  });
}
