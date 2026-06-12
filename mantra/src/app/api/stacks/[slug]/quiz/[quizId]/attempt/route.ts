import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { slug: string; quizId: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { answers } = await req.json();
  if (!Array.isArray(answers)) return NextResponse.json({ error: "answers array required" }, { status: 400 });

  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    include: {
      questions: { orderBy: { order: "asc" } },
      stack: { select: { id: true, slug: true, title: true } },
    },
  });

  if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
  if (quiz.stack.slug !== params.slug) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

  if (quiz.expiresAt && new Date() > quiz.expiresAt) {
    return NextResponse.json({ error: "This quiz has expired." }, { status: 410 });
  }

  let score = 0;
  const topicResults: Record<string, { correct: number; total: number }> = {};

  for (let i = 0; i < quiz.questions.length; i++) {
    const q = quiz.questions[i];
    const isCorrect = answers[i] === q.correctIndex;
    if (isCorrect) score++;
    const topic = (q.topic as string | null) || "General";
    if (!topicResults[topic]) topicResults[topic] = { correct: 0, total: 0 };
    topicResults[topic].total++;
    if (isCorrect) topicResults[topic].correct++;
  }

  const total = quiz.questions.length;
  const attempt = await prisma.quizAttempt.create({
    data: { quizId: quiz.id, userId: session.user.id, score, total, answers },
  });

  const pct = Math.round((score / total) * 100);
  const grade =
    pct >= 90 ? "Excellent" :
    pct >= 75 ? "Great" :
    pct >= 60 ? "Good" :
    pct >= 40 ? "Fair" : "Keep practising";

  const strongAreas = Object.entries(topicResults)
    .filter(([, v]) => v.correct / v.total >= 0.7)
    .map(([topic]) => topic);

  const weakAreas = Object.entries(topicResults)
    .filter(([, v]) => v.correct / v.total < 0.5)
    .map(([topic]) => topic);

  await prisma.notification.create({
    data: {
      userId: session.user.id,
      type: "QUIZ",
      title: "Quiz completed",
      body: `You scored ${score}/${total} (${pct}%) on "${quiz.title}" in "${quiz.stack.title}". ${grade}!`,
      link: `/stacks/${quiz.stack.slug}`,
    },
  });

  return NextResponse.json({
    attempt: { ...attempt, score, total },
    score, total, pct, grade,
    correct: quiz.questions.map(q => q.correctIndex),
    explanations: quiz.questions.map(q => q.explanation),
    topics: quiz.questions.map(q => q.topic),
    topicResults,
    strongAreas,
    weakAreas,
  });
}
