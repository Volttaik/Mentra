import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const CREDIT_PACKS: Record<string, number> = {
  starter: 10,
  popular: 25,
  pro: 60,
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { reference } = await req.json();
  if (!reference) {
    return NextResponse.json({ error: "reference required" }, { status: 400 });
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 503 });
  }

  const paystackRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    }
  );

  const paystackData = await paystackRes.json();
  if (!paystackData.status || paystackData.data?.status !== "success") {
    return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
  }

  const existingTxn = await prisma.creditTransaction.findFirst({
    where: { paystackRef: reference, userId: session.user.id },
  });

  if (!existingTxn) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (existingTxn.type === "purchase_complete") {
    return NextResponse.json({ error: "Already credited" }, { status: 409 });
  }

  const metadata = paystackData.data.metadata;
  const pack = metadata?.pack as string;
  const creditsToAdd = CREDIT_PACKS[pack] ?? existingTxn.amount;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { aiCredits: { increment: creditsToAdd } },
    }),
    prisma.creditTransaction.update({
      where: { id: existingTxn.id },
      data: { type: "purchase_complete" },
    }),
    prisma.notification.create({
      data: {
        userId: session.user.id,
        type: "CREDIT",
        title: "Credits added",
        body: `${creditsToAdd} AI credits have been added to your account.`,
        link: "/dashboard",
      },
    }),
  ]);

  const updatedUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiCredits: true },
  });

  return NextResponse.json({ success: true, credits: updatedUser?.aiCredits ?? 0 });
}
