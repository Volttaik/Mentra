import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [paidStacks, recentPurchases, allPurchasesRevenue, discussions] = await Promise.all([
    prisma.stack.findMany({
      where: { ownerId: userId, isPaid: true },
      select: {
        id: true, title: true, slug: true, banner: true, profile: true, price: true,
        _count: { select: { purchases: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.purchase.findMany({
      where: { stack: { ownerId: userId }, status: "success" },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        stack: { select: { id: true, title: true, slug: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.purchase.aggregate({
      where: { stack: { ownerId: userId }, status: "success" },
      _sum: { amount: true },
    }),
    prisma.discussion.findMany({
      where: { stack: { ownerId: userId } },
      include: {
        user: { select: { id: true, name: true, username: true, image: true } },
        stack: { select: { id: true, title: true, slug: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
  ]);

  const totalRevenue = allPurchasesRevenue._sum.amount ?? 0;
  const totalBuyers = recentPurchases.length;

  return NextResponse.json({
    stats: {
      totalRevenue,
      totalBuyers,
      paidStackCount: paidStacks.length,
    },
    paidStacks: paidStacks.map(s => ({
      ...s,
      buyerCount: s._count.purchases,
    })),
    recentPurchases: recentPurchases.map(p => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      purchasedAt: p.createdAt.toISOString(),
      buyer: p.user,
      stack: p.stack,
    })),
    discussions: discussions.map(d => ({
      id: d.id,
      title: d.title,
      createdAt: d.createdAt.toISOString(),
      commentCount: d._count.comments,
      author: d.user,
      stack: d.stack,
    })),
  });
}
