import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

    const community = await prisma.community.findUnique({
      where: { slug: params.slug },
      select: {
        name: true,
        description: true,
        rules: true,
        _count: { select: { members: true, stacks: true } },
      },
    });

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const systemPrompt = `You are a helpful AI assistant for the "${community.name}" community on Mentra, an academic knowledge platform.

Community details:
- Name: ${community.name}
- Description: ${community.description ?? "N/A"}
- Members: ${community._count.members}
- Stacks: ${community._count.stacks}
${community.rules ? `- Community rules: ${community.rules.slice(0, 400)}` : ""}

Help community members with tasks like drafting messages, summarising discussions, brainstorming discussion topics, writing announcements, and anything else relevant to this academic community. Be concise, friendly, and helpful.`;

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-20),
      ],
      max_tokens: 800,
      temperature: 0.7,
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
          description: `AI assistant in community "${community.name}"`,
        },
      }),
    ]);

    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { aiCredits: true },
    });

    return NextResponse.json({ reply, creditsRemaining: updatedUser?.aiCredits ?? 0 });
  } catch (err: any) {
    console.error("Community AI error:", err);
    return NextResponse.json({ error: "Failed to get AI response." }, { status: 500 });
  }
}
