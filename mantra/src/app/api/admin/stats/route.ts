import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [totalUsers, totalStacks, totalStars, totalDiscussions, newUsersThisWeek, newStacksThisWeek] =
    await Promise.all([
      prisma.user.count(),
      prisma.stack.count(),
      prisma.stackStar.count(),
      prisma.discussion.count(),
      prisma.user.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 86400_000) } },
      }),
      prisma.stack.count({
        where: { createdAt: { gte: new Date(Date.now() - 7 * 86400_000) } },
      }),
    ]);

  return NextResponse.json({
    totalUsers,
    totalStacks,
    totalStars,
    totalDiscussions,
    newUsersThisWeek,
    newStacksThisWeek,
  });
}
