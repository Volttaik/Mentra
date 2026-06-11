import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const QUIZ_CREDIT_COST = 5;

function getGroq() {
  const Groq = require("groq-sdk");
  return new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });
}

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();

  const stack = await prisma.stack.findUnique({
    where: { slug: params.slug },
    select: { id: true, isPublic: true, ownerId: true },
  });

  if (!stack) return NextResponse.json({ error: "Stack not found" }, { status: 404 });

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
      where: {
        userId: session.user.id,
        quizId: { in: quizzes.map((q) => q.id) },
      },
      orderBy: { createdAt: "desc" },
    });
    for (const a of attempts) {
      if (!myAttempts[a.quizId]) myAttempts[a.quizId] = [];
      myAttempts[a.quizId].push(a);
    }
  }

  return NextResponse.json({
    quizzes: quizzes.map((q) => ({
      ...q,
      myAttempts: myAttempts[q.id] ?? [],
    })),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stack = await prisma.stack.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      ownerId: true,
      title: true,
      description: true,
      courseCode: true,
      tags: { select: { tag: { select: { name: true } } } },
      modules: { select: { title: true } },
    },
  });

  if (!stack) return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  if (stack.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Only the owner can generate quizzes" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiCredits: true },
  });

  if (!user || user.aiCredits < QUIZ_CREDIT_COST) {
    return NextResponse.json(
      { error: `Insufficient credits. Quiz generation costs ${QUIZ_CREDIT_COST} credits.` },
      { status: 402 }
    );
  }

  const { questionCount = 10 } = await req.json().catch(() => ({}));
  const count = Math.min(Math.max(Number(questionCount) || 10, 5), 20);

  const latestMt = await prisma.mtContent.findFirst({
    where: { stackId: stack.id },
    orderBy: { createdAt: "desc" },
    select: { summary: true, concepts: true, rawContent: true },
  });

  const tagNames = stack.tags.map((t: any) => t.tag.name).join(", ");
  const concepts = Array.isArray(latestMt?.concepts)
    ? (latestMt.concepts as string[]).join(", ")
    : "";

  const contextText = latestMt?.rawContent
    ? latestMt.rawContent.slice(0, 3000)
    : latestMt?.summary ?? stack.description ?? "";

  const prompt = `You are a university-level quiz generator. Generate a multiple-choice quiz for the educational stack titled "${stack.title}".

Context:
- Course: ${stack.courseCode || "General"}
- Topics: ${tagNames || "N/A"}
- Modules: ${stack.modules.map((m: any) => m.title).join(", ") || "N/A"}
- Key concepts: ${concepts || "N/A"}
- Content: ${contextText}

Generate exactly ${count} multiple-choice questions. Each question must have exactly 4 options.

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "title": "Quiz title based on the content",
  "description": "Brief description of what this quiz covers",
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Brief explanation of why this answer is correct"
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

  const quiz = await prisma.$transaction(async (tx) => {
    const created = await tx.quiz.create({
      data: {
        stackId: stack.id,
        title: parsed.title || `${stack.title} Quiz`,
        description: parsed.description || null,
        questions: {
          create: parsed.questions.map((q: any, i: number) => ({
            question: q.question,
            options: q.options,
            correctIndex: q.correctIndex,
            explanation: q.explanation || null,
            order: i,
          })),
        },
      },
      include: { questions: { orderBy: { order: "asc" } } },
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: { aiCredits: { decrement: QUIZ_CREDIT_COST } },
    });

    await tx.creditTransaction.create({
      data: {
        userId: session.user.id,
        amount: -QUIZ_CREDIT_COST,
        type: "quiz_generation",
        description: `Generated quiz for "${stack.title}"`,
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
