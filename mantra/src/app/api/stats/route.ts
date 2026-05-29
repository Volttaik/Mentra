import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [totalStacks, totalUsers, totalStars] = await Promise.all([
    prisma.stack.count({ where: { isPublic: true } }),
    prisma.user.count(),
    prisma.stackStar.count(),
  ]);

  const universities = await prisma.user.groupBy({
    by: ["university"],
    where: { university: { not: null } },
  });

  return NextResponse.json({
    totalStacks,
    totalUsers,
    totalStars,
    totalUniversities: universities.length,
  });
}
