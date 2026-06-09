import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  const purchase = await prisma.purchase.findUnique({ where: { paystackRef: reference } });
  if (!purchase) {
    return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
  }
  if (purchase.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.purchase.update({
    where: { id: purchase.id },
    data: { status: "success" },
  });

  return NextResponse.json({ success: true, stackId: purchase.stackId });
}
