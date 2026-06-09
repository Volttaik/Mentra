import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

const CHAT_CREDIT_COST = 1;

function getGroq() {
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

    const stack = await prisma.stack.findUnique({
      where: { slug: params.slug },
      select: {
        title: true,
        description: true,
        courseCode: true,
        university: true,
        department: true,
        semester: true,
        tags: { select: { tag: { select: { name: true } } } },
        readme: true,
        modules: { select: { title: true, type: true } },
      },
    });

    if (!stack) {
      return NextResponse.json({ error: "Stack not found" }, { status: 404 });
    }

    const latestMt = await prisma.mtContent.findFirst({
      where: { stackId: (await prisma.stack.findUnique({ where: { slug: params.slug }, select: { id: true } }))!.id },
      orderBy: { createdAt: "desc" },
      select: { summary: true, concepts: true },
    });

    const tagNames = stack.tags.map((t: any) => t.tag.name).join(", ");
    const conceptsList = Array.isArray(latestMt?.concepts)
      ? (latestMt.concepts as string[]).slice(0, 20).join(", ")
      : "";

    const systemPrompt = `You are an AI study assistant for the Mentra educational stack titled "${stack.title}".

Stack details:
- Course: ${stack.courseCode || "N/A"}
- University: ${stack.university || "N/A"}
- Department: ${stack.department || "N/A"}
- Semester: ${stack.semester || "N/A"}
- Topics: ${tagNames || "N/A"}
- Description: ${stack.description || "N/A"}
${stack.readme ? `- README: ${stack.readme.slice(0, 500)}` : ""}
${stack.modules?.length ? `- Modules: ${stack.modules.map((m: any) => m.title).join(", ")}` : ""}
${latestMt?.summary ? `- Content summary: ${latestMt.summary.slice(0, 600)}` : ""}
${conceptsList ? `- Key concepts: ${conceptsList}` : ""}

Help students understand this stack's content. Answer questions about the material, explain key concepts, summarise topics, clarify difficult points, and help students study. Be concise, clear, and academically helpful.`;

    const completion = await getGroq().chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-20),
      ],
      max_tokens: 1024,
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
          description: `AI chat in "${stack.title}"`,
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
