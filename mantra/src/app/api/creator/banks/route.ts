import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.PAYSTACK_SECRET_KEY) {
    return NextResponse.json([], { status: 200 });
  }

  const res = await fetch("https://api.paystack.co/bank?country=nigeria&currency=NGN&perPage=100", {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    next: { revalidate: 3600 },
  });

  if (!res.ok) return NextResponse.json([]);
  const data = await res.json();
  return NextResponse.json(
    (data.data ?? []).map((b: any) => ({ name: b.name, code: b.code }))
  );
}
