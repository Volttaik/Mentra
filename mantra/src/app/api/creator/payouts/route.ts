import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { amount } = await req.json();
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Payment provider not configured" }, { status: 503 });
  }

  const bankAccount = await prisma.bankAccount.findUnique({
    where: { userId: session.user.id },
  });

  if (!bankAccount?.recipientCode) {
    return NextResponse.json({ error: "No verified bank account found. Add a bank account first." }, { status: 400 });
  }

  const availableRevenue = await prisma.purchase.aggregate({
    where: { stack: { ownerId: session.user.id }, status: "success" },
    _sum: { amount: true },
  });

  const totalRevenue = availableRevenue._sum.amount ?? 0;
  if (amount > totalRevenue) {
    return NextResponse.json({ error: "Withdrawal amount exceeds available balance" }, { status: 400 });
  }

  const amountKobo = Math.round(amount * 100);

  const transferRes = await fetch("https://api.paystack.co/transfer", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      source: "balance",
      amount: amountKobo,
      recipient: bankAccount.recipientCode,
      reason: "Mentra Creator Payout",
    }),
  });

  const transferData = await transferRes.json();

  if (!transferData.status) {
    return NextResponse.json(
      { error: transferData.message ?? "Transfer failed. Try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    reference: transferData.data?.transfer_code,
    message: "Payout initiated. Funds will arrive within 24 hours.",
  });
}
