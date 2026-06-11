import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const listings = await prisma.agentListing.findMany({
    where: { isActive: true },
    include: {
      agent: {
        select: {
          id: true,
          name: true,
          subject: true,
          domain: true,
          avatarUrl: true,
          description: true,
          price: true,
          isPaid: true,
          owner: { select: { name: true, username: true, image: true } },
          _count: { select: { subscriptions: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(listings);
}
