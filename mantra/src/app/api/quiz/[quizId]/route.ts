import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { quizId: string } }) {
  const session = await auth();

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      questions: { orderBy: { order: "asc" } },
      stack: { select: { id: true, slug: true, title: true, isPublic: true, ownerId: true } },
      _count: { select: { attempts: true } },
    },
  });

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  const isOwner = session?.user?.id === quiz.stack.ownerId;
  if (!quiz.stack.isPublic && !isOwner) {
    return NextResponse.json({ error: "This stack is private" }, { status: 403 });
  }

  if (quiz.expiresAt && new Date() > quiz.expiresAt) {
    return NextResponse.json({ error: "This quiz has expired" }, { status: 410 });
  }

  const allAttempts = await prisma.quizAttempt.findMany({
    where: { quizId: quiz.id },
    orderBy: [{ score: "desc" }, { createdAt: "asc" }],
    take: 50,
    include: { user: { select: { id: true, name: true, username: true, image: true } } },
  });

  const seenUsers = new Set<string>();
  const leaderboard = allAttempts
    .filter(a => { if (seenUsers.has(a.userId)) return false; seenUsers.add(a.userId); return true; })
    .slice(0, 10)
    .map((a, i) => ({
      rank: i + 1,
      userId: a.userId,
      name: a.user.name ?? "Anonymous",
      username: a.user.username ?? "",
      image: a.user.image,
      score: a.score,
      total: a.total,
      pct: Math.round((a.score / a.total) * 100),
    }));

  let userBestAttempt = null;
  if (session?.user?.id) {
    const myBest = await prisma.quizAttempt.findFirst({
      where: { quizId: quiz.id, userId: session.user.id },
      orderBy: { score: "desc" },
    });
    if (myBest) {
      userBestAttempt = { score: myBest.score, total: myBest.total, pct: Math.round((myBest.score / myBest.total) * 100) };
    }
  }

  return NextResponse.json({ quiz, leaderboard, userBestAttempt });
}
