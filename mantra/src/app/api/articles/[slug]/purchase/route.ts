import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(_: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const article = await prisma.article.findUnique({ where: { slug: params.slug }, select: { id: true, isPaid: true, price: true, authorId: true } });
  if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (article.authorId === session.user.id) return NextResponse.json({ error: "You own this article" }, { status: 400 });

  const existing = await prisma.articlePurchase.findFirst({ where: { userId: session.user.id, articleId: article.id } });
  if (existing) return NextResponse.json({ message: "Already purchased" });

  if (!article.isPaid || article.price === 0) {
    const purchase = await prisma.articlePurchase.create({ data: { userId: session.user.id, articleId: article.id, amount: 0 } });
    return NextResponse.json(purchase, { status: 201 });
  }

  const creditCost = Math.ceil(article.price);
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { aiCredits: true } });
  if (!user || user.aiCredits < creditCost) return NextResponse.json({ error: `Need ${creditCost} credits` }, { status: 402 });

  const purchase = await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: session.user.id }, data: { aiCredits: { decrement: creditCost } } });
    await tx.creditTransaction.create({ data: { userId: session.user.id, amount: -creditCost, type: "ARTICLE_PURCHASE", description: `Article: ${params.slug}` } });
    return tx.articlePurchase.create({ data: { userId: session.user.id, articleId: article.id, amount: creditCost } });
  });

  return NextResponse.json(purchase, { status: 201 });
}
