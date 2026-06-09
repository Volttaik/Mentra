import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const CREDIT_PACKS = {
  starter: { credits: 50, amount: 50000 },
  popular: { credits: 100, amount: 100000 },
  pro: { credits: 250, amount: 220000 },
} as const;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pack } = await req.json();
  if (!pack || !(pack in CREDIT_PACKS)) {
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, name: true },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const selectedPack = CREDIT_PACKS[pack as keyof typeof CREDIT_PACKS];
  const reference = `credits_${session.user.id}_${pack}_${Date.now()}`;

  const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: selectedPack.amount,
      reference,
      metadata: {
        userId: session.user.id,
        pack,
        credits: selectedPack.credits,
        type: "credit_purchase",
      },
    }),
  });

  const paystackData = await paystackRes.json();
  if (!paystackData.status) {
    return NextResponse.json({ error: "Failed to initialize payment" }, { status: 500 });
  }

  await prisma.creditTransaction.create({
    data: {
      userId: session.user.id,
      amount: selectedPack.credits,
      type: "purchase_pending",
      description: `${selectedPack.credits} credit pack (${pack})`,
      paystackRef: reference,
    },
  });

  return NextResponse.json({
    authorizationUrl: paystackData.data.authorization_url,
    reference,
    pack: selectedPack,
  });
}
