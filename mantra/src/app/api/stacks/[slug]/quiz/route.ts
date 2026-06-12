import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assembleStackContent } from "@/lib/stack-content";

const CREDIT_PER_QUESTION = 1;

function getGroq() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Groq = require("groq-sdk");
  return new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });
}

async function deleteExpiredQuizzes(stackId: string) {
  await prisma.quiz.deleteMany({
    where: { stackId, expiresAt: { lt: new Date() } },
  });
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await auth();

  const stack = await prisma.stack.findUnique({
    where: { slug: params.slug },
    select: { id: true, isPublic: true, ownerId: true },
  });
  if (!stack) return NextResponse.json({ error: "Stack not found" }, { status: 404 });

  await deleteExpiredQuizzes(stack.id);

  const quizzes = await prisma.quiz.findMany({
    where: { stackId: stack.id },
    orderBy: { createdAt: "desc" },
    include: {
      questions: { orderBy: { order: "asc" } },
      _count: { select: { attempts: true } },
    },
  });

  const myAttempts: Record<string, any[]> = {};
  if (session?.user?.id) {
    const attempts = await prisma.quizAttempt.findMany({
      where: { userId: session.user.id, quizId: { in: quizzes.map(q => q.id) } },
      orderBy: { createdAt: "desc" },
    });
    for (const a of attempts) {
      if (!myAttempts[a.quizId]) myAttempts[a.quizId] = [];
      myAttempts[a.quizId].push(a);
    }
  }

  return NextResponse.json({
    quizzes: quizzes.map(q => ({ ...q, myAttempts: myAttempts[q.id] ?? [] })),
  });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stack = await prisma.stack.findUnique({
    where: { slug: params.slug },
    select: { id: true, ownerId: true },
  });

  if (!stack) return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  if (stack.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Only the owner can generate quizzes" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const questionCount = Math.min(Math.max(Number(body.questionCount) || 10, 5), 20);
  const durationMinutes = Math.max(Number(body.durationMinutes) || 0, 0);
  const creditCost = questionCount * CREDIT_PER_QUESTION;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { aiCredits: true } });
  if (!user || user.aiCredits < creditCost) {
    return NextResponse.json(
      { error: `Insufficient credits. This quiz costs ${creditCost} credits (${CREDIT_PER_QUESTION} per question).` },
      { status: 402 }
    );
  }

  const content = await assembleStackContent(stack.id);
  if (!content) return NextResponse.json({ error: "Stack not found" }, { status: 404 });

  if (!content.richContext || content.mtContents.length === 0) {
    return NextResponse.json(
      { error: "No content found in this stack. Upload study materials first before generating a quiz." },
      { status: 422 }
    );
  }

  const prompt = `You are a university-level quiz generator. Generate a multiple-choice quiz for the educational stack titled "${content.title}".

${content.richContext}

Generate exactly ${questionCount} multiple-choice questions based on the actual content above.
Each question must have exactly 4 answer options.
Assign a short topic label (1-4 words) to each question describing the concept it tests.

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "title": "Quiz title based on the content",
  "description": "Brief description of what this quiz covers",
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct",
      "topic": "Short topic label"
    }
  ]
}`;

  const completion = await getGroq().chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 4096,
    temperature: 0.4,
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  let parsed: any;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? raw);
  } catch {
    return NextResponse.json({ error: "Failed to parse AI response. Please try again." }, { status: 500 });
  }

  if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
    return NextResponse.json({ error: "AI did not return valid questions." }, { status: 500 });
  }

  const expiresAt = durationMinutes > 0 ? new Date(Date.now() + durationMinutes * 60 * 1000) : null;

  const quiz = await prisma.$transaction(async tx => {
    const created = await tx.quiz.create({
      data: {
        stackId: stack.id,
        title: parsed.title || `${content.title} Quiz`,
        description: parsed.description || null,
        durationMinutes,
        expiresAt,
        questions: {
          create: parsed.questions.map((q: any, i: number) => ({
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation || null,
            topic: q.topic || null,
            order: i,
          })),
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: { aiCredits: { decrement: creditCost } },
    });

    await tx.creditTransaction.create({
      data: {
        userId: session.user.id,
        amount: -creditCost,
        type: "quiz_generation",
        description: `Generated ${questionCount}-question quiz for "${content.title}"`,
      },
    });

    return created;
  });

  const updatedUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiCredits: true },
  });

  return NextResponse.json({ quiz, creditsRemaining: updatedUser?.aiCredits ?? 0 });
}
