import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await prisma.bankAccount.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true, accountNumber: true, bankCode: true,
      bankName: true, accountName: true,
    },
  });

  return NextResponse.json(account ?? null);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { accountNumber, bankCode, verificationCode } = await req.json();

  if (!accountNumber || !bankCode || !verificationCode) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true },
  });

  const otp = await prisma.emailVerification.findFirst({
    where: {
      email: user?.email ?? "",
      code: verificationCode,
      purpose: "bank_account",
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) {
    return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
  }

  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ error: "Payment provider not configured" }, { status: 503 });
  }

  const resolveRes = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    }
  );
  const resolveData = await resolveRes.json();

  if (!resolveData.status) {
    return NextResponse.json({ error: "Could not verify account. Check account number and bank." }, { status: 400 });
  }

  const accountName: string = resolveData.data.account_name;

  const recipientRes = await fetch("https://api.paystack.co/transferrecipient", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "nuban",
      name: accountName,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    }),
  });
  const recipientData = await recipientRes.json();
  const recipientCode: string | null = recipientData.data?.recipient_code ?? null;

  const banksRes = await fetch("https://api.paystack.co/bank", {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const banksData = await banksRes.json();
  const bank = banksData.data?.find((b: any) => b.code === bankCode);
  const bankName = bank?.name ?? bankCode;

  await prisma.emailVerification.update({ where: { id: otp.id }, data: { used: true } });

  const saved = await prisma.bankAccount.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      accountNumber,
      bankCode,
      bankName,
      accountName,
      recipientCode,
    },
    update: {
      accountNumber,
      bankCode,
      bankName,
      accountName,
      recipientCode,
    },
  });

  return NextResponse.json({
    id: saved.id,
    accountNumber: saved.accountNumber,
    bankName: saved.bankName,
    accountName: saved.accountName,
  });
}
