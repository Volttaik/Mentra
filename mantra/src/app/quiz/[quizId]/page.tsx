import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import QuizChallenge from "@/components/QuizChallenge";

export default async function QuizChallengePage({ params }: { params: { quizId: string } }) {
  const session = await auth();

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      questions: { orderBy: { order: "asc" } },
      stack: { select: { id: true, slug: true, title: true, isPublic: true, ownerId: true } },
      _count: { select: { attempts: true } },
    },
  });

  if (!quiz) notFound();

  const isOwner = session?.user?.id === quiz.stack.ownerId;
  if (!quiz.stack.isPublic && !isOwner) notFound();

  const expired = !!(quiz.expiresAt && new Date() > quiz.expiresAt);

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
      image: (a.user.image as string | null),
      score: a.score,
      total: a.total,
      pct: Math.round((a.score / a.total) * 100),
    }));

  return (
    <QuizChallenge
      quiz={quiz as any}
      leaderboard={leaderboard}
      currentUserId={session?.user?.id ?? null}
      isAuthenticated={!!session?.user}
      expired={expired}
    />
  );
}
