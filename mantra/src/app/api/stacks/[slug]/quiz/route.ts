import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assembleStackContent } from "@/lib/stack-content";

const CREDIT_PER_QUESTION = 2;

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
    select: { id: true, ownerId: true, isPublic: true },
  });

  if (!stack) return NextResponse.json({ error: "Stack not found" }, { status: 404 });
  if (stack.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Only the stack owner can generate quizzes" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const questionCount = Math.min(Math.max(Number(body.questionCount) || 10, 5), 20);
  const durationMinutes = Math.max(Number(body.durationMinutes) || 0, 0);
  const instructions: string = (body.instructions ?? "").toString().slice(0, 1000);
  const isPaid: boolean = !!body.isPaid;
  const price: number = Math.max(0, Number(body.price) || 0);
  const creditCost = questionCount * CREDIT_PER_QUESTION;

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { aiCredits: true } });
  if (!user || (user.aiCredits ?? 0) < creditCost) {
    return NextResponse.json(
      { error: `Insufficient credits. This quiz costs ${creditCost} credits (${CREDIT_PER_QUESTION} per question).` },
      { status: 402 }
    );
  }

  const content = await assembleStackContent(stack.id);
  if (!content) return NextResponse.json({ error: "Stack not found" }, { status: 404 });

  const hasContent = content.mtContents.length > 0 || (content.readme && content.readme.length > 50);
  if (!hasContent) {
    return NextResponse.json(
      { error: "No study materials found in this stack. Upload PDFs, notes, or other content before generating a quiz." },
      { status: 422 }
    );
  }

  const instructionsBlock = instructions
    ? `\nCREATOR INSTRUCTIONS: The quiz creator has provided these specific instructions — follow them closely:\n"${instructions}"\n`
    : "";

  const prompt = `You are an expert university-level quiz generator. Generate a high-quality multiple-choice quiz based on the exact educational content below.${instructionsBlock}

STACK CONTENT:
${content.richContext}

TASK: Generate exactly ${questionCount} multiple-choice questions that deeply test understanding of the actual content above.
- Each question MUST be grounded in the provided content — no general knowledge questions
- Each question has exactly 4 answer options
- The correct answer should require real understanding, not just recall
- Assign a short topic label (1-4 words) to each question
- Write a clear explanation for why the correct answer is right
${instructions ? `- IMPORTANT: Follow the creator's instructions above when choosing topics and difficulty` : ""}

Return ONLY valid JSON (no markdown fences, no commentary):
{
  "title": "Specific quiz title based on the content",
  "description": "Brief description of what this quiz covers",
  "questions": [
    {
      "question": "Clear, specific question testing real understanding",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct, referencing the content",
      "topic": "Short topic label"
    }
  ]
}`;

  try {
    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 6000,
      temperature: 0.35,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: any;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch?.[0] ?? raw);
    } catch {
      return NextResponse.json({ error: "AI returned an unexpected format. Please try again." }, { status: 500 });
    }

    if (!parsed.questions || !Array.isArray(parsed.questions) || parsed.questions.length === 0) {
      return NextResponse.json({ error: "AI did not return valid questions. Please try again." }, { status: 500 });
    }

    const expiresAt = durationMinutes > 0 ? new Date(Date.now() + durationMinutes * 60 * 1000) : null;

    const quiz = await prisma.$transaction(async tx => {
      const created = await tx.quiz.create({
        data: {
          stackId: stack.id,
          title: parsed.title || `${content.title} Quiz`,
          description: parsed.description || null,
          instructions: instructions || null,
          durationMinutes,
          expiresAt,
          isPaid,
          price: isPaid ? price : 0,
          questions: {
            create: parsed.questions.map((q: any, i: number) => ({
              question: q.question,
              options: q.options,
              correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
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
  } catch (e: any) {
    return NextResponse.json({ error: "Quiz generation failed. Please try again.", detail: e?.message }, { status: 500 });
  }
}
