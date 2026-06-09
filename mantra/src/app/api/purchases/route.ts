import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const purchases = await prisma.purchase.findMany({
    where: { userId: session.user.id, status: "success" },
    include: {
      stack: {
        include: {
          owner: { select: { id: true, name: true, username: true, image: true } },
          tags: { include: { tag: true } },
          _count: { select: { stars: true, forks: true, discussions: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(
    purchases.map(p => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      purchasedAt: p.createdAt.toISOString(),
      stack: {
        id: p.stack.id,
        title: p.stack.title,
        slug: p.stack.slug,
        description: p.stack.description,
        banner: p.stack.banner,
        profile: p.stack.profile,
        owner: p.stack.owner,
        tags: p.stack.tags.map((t: any) => t.tag?.name).filter(Boolean),
        stars: p.stack._count.stars,
        forks: p.stack._count.forks,
        discussions: p.stack._count.discussions,
      },
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { stackId } = await req.json();
  if (!stackId) {
    return NextResponse.json({ error: "stackId required" }, { status: 400 });
  }

  const stack = await prisma.stack.findUnique({
    where: { id: stackId },
    select: { id: true, title: true, isPaid: true, price: true, ownerId: true },
  });

  if (!stack) return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  if (!stack.isPaid || !stack.price) {
    return NextResponse.json({ error: "This stack is free" }, { status: 400 });
  }
  if (stack.ownerId === session.user.id) {
    return NextResponse.json({ error: "You own this stack" }, { status: 400 });
  }

  const existing = await prisma.purchase.findFirst({
    where: { userId: session.user.id, stackId: stack.id, status: "success" },
  });
  if (existing) {
    return NextResponse.json({ error: "Already purchased" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
  }

  const amountKobo = Math.round((stack.price ?? 0) * 100);
  const reference = `mnt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user?.email,
      amount: amountKobo,
      reference,
      metadata: {
        stackId: stack.id,
        stackTitle: stack.title,
        userId: session.user.id,
      },
    }),
  });

  const paystackData = await paystackRes.json();
  if (!paystackData.status) {
    return NextResponse.json({ error: "Payment initialization failed" }, { status: 500 });
  }

  await prisma.purchase.upsert({
    where: { userId_stackId: { userId: session.user.id, stackId: stack.id } },
    create: {
      userId: session.user.id,
      stackId: stack.id,
      amount: stack.price ?? 0,
      currency: "NGN",
      paystackRef: reference,
      status: "pending",
    },
    update: {
      paystackRef: reference,
      status: "pending",
    },
  });

  return NextResponse.json({
    authorizationUrl: paystackData.data.authorization_url,
    reference,
  });
}
