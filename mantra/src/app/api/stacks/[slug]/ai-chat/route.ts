import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assembleStackContent } from "@/lib/stack-content";

const CHAT_CREDIT_COST = 1;

function getGroq() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Groq = require("groq-sdk");
  return new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { aiCredits: true },
    });

    if (!user || user.aiCredits < CHAT_CREDIT_COST) {
      return NextResponse.json(
        { error: "Insufficient credits. Please purchase more AI credits." },
        { status: 402 }
      );
    }

    const stackRow = await prisma.stack.findUnique({
      where: { slug: params.slug },
      select: { id: true, isPublic: true, ownerId: true },
    });

    if (!stackRow) {
      return NextResponse.json({ error: "Stack not found" }, { status: 404 });
    }

    const canAccess = stackRow.isPublic || stackRow.ownerId === session.user.id;
    if (!canAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const assembled = await assembleStackContent(stackRow.id);
    if (!assembled) {
      return NextResponse.json({ error: "Stack not found" }, { status: 404 });
    }

    const systemPrompt = `You are an AI study assistant for the Mentra educational stack titled "${assembled.title}".

You have full access to this stack's content. Use it to give specific, accurate answers.

${assembled.richContext}

Help students understand this stack's content. Answer questions about the material, explain key concepts, summarise topics, clarify difficult points, and help students study effectively. Be concise, clear, and academically helpful. When referencing specific content from the stack, be precise and cite the relevant section or concept.`;

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-20),
      ],
      max_tokens: 1024,
      temperature: 0.6,
    });

    const reply = completion.choices[0]?.message?.content ?? "";

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { aiCredits: { decrement: CHAT_CREDIT_COST } },
      }),
      prisma.creditTransaction.create({
        data: {
          userId: session.user.id,
          amount: -CHAT_CREDIT_COST,
          type: "ai_chat",
          description: `AI chat in "${assembled.title}"`,
        },
      }),
    ]);

    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { aiCredits: true },
    });

    return NextResponse.json({ reply, creditsRemaining: updatedUser?.aiCredits ?? 0 });
  } catch (err: any) {
    console.error("AI chat error:", err);
    return NextResponse.json(
      { error: "Failed to get AI response." },
      { status: 500 }
    );
  }
}
