import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getGroq() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Groq = require("groq-sdk");
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function buildSystemPrompt(agent: {
  name: string; subject: string; level: string; domain: string; tone: string; personality: string | null;
}, knowledge: string, platformContext: string) {
  const toneMap: Record<string, string> = {
    patient: "You are patient and thorough. You explain step-by-step with many examples.",
    concise: "You are concise and direct. Get to the point, minimal fluff.",
    socratic: "You use the Socratic method. Guide the user to answers with probing questions.",
    friendly: "You are friendly, warm, and conversational. Encouraging and casual.",
    strict: "You are strict and rigorous. Hold high standards and demand precision.",
    motivational: "You are energetic, uplifting, and action-oriented.",
  };

  return `You are ${agent.name}, a specialized AI agent on Mentra.
Subject: ${agent.subject} | Level: ${agent.level} | Domain: ${agent.domain}
Communication style: ${toneMap[agent.tone] || toneMap.patient}
${agent.personality ? `\nPersonality: ${agent.personality}` : ""}

You have full access to the user's Mentra platform context:
${platformContext}

${knowledge ? `\nYour knowledge base:\n${knowledge}\n` : ""}

You can reference the user's stacks, stack flows, articles, and communities when relevant.
Always stay in character as ${agent.name}. Be helpful, accurate, and engaged.`;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { message, conversationId } = body;
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { aiCredits: true, name: true } });
  if (!user || user.aiCredits < 1) return NextResponse.json({ error: "Not enough credits" }, { status: 402 });

  const agent = await prisma.customAgent.findFirst({
    where: { id: params.id, OR: [{ ownerId: session.user.id }, { subscriptions: { some: { userId: session.user.id } } }] },
    include: { knowledgeFiles: { select: { content: true, name: true } } },
  });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  const [stacks, flows, articles, communities] = await Promise.all([
    prisma.stack.findMany({ where: { ownerId: session.user.id }, select: { title: true, description: true, slug: true, courseCode: true }, take: 10 }),
    prisma.stackFlow.findMany({ where: { userId: session.user.id }, select: { name: true, description: true, emoji: true, _count: { select: { items: true } } }, take: 5 }),
    prisma.article.findMany({ where: { authorId: session.user.id, isPublished: true }, select: { title: true, summary: true, slug: true }, take: 5 }),
    prisma.communityMember.findMany({ where: { userId: session.user.id }, select: { community: { select: { name: true, slug: true } } }, take: 5 }),
  ]);

  const platformContext = [
    stacks.length ? `Stacks (${stacks.length}): ${stacks.map(s => `"${s.title}"${s.courseCode ? ` (${s.courseCode})` : ""}`).join(", ")}` : "",
    flows.length ? `Stack Flows (${flows.length}): ${flows.map(f => `${f.emoji} "${f.name}" (${f._count.items} stacks)`).join(", ")}` : "",
    articles.length ? `Articles (${articles.length}): ${articles.map(a => `"${a.title}"`).join(", ")}` : "",
    communities.length ? `Communities: ${communities.map(c => c.community.name).join(", ")}` : "",
  ].filter(Boolean).join("\n");

  const knowledge = agent.knowledgeFiles.map(f => f.content ? `[${f.name}]\n${f.content}` : "").filter(Boolean).join("\n\n---\n\n");

  let conv;
  if (conversationId) {
    conv = await prisma.customAgentConversation.findFirst({ where: { id: conversationId, userId: session.user.id } });
  }
  if (!conv) {
    conv = await prisma.customAgentConversation.create({ data: { agentId: params.id, userId: session.user.id, title: message.slice(0, 60) } });
  }

  const history = await prisma.customAgentMessage.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  await prisma.customAgentMessage.create({ data: { conversationId: conv.id, role: "user", content: message } });

  const messages = [
    { role: "system", content: buildSystemPrompt(agent, knowledge, platformContext) },
    ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];

  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content || "I'm not sure how to respond to that.";

  const [assistantMsg] = await Promise.all([
    prisma.customAgentMessage.create({ data: { conversationId: conv.id, role: "assistant", content: reply } }),
    prisma.user.update({ where: { id: session.user.id }, data: { aiCredits: { decrement: 1 } } }),
    prisma.customAgentConversation.update({ where: { id: conv.id }, data: { updatedAt: new Date(), title: conv.title === "New Chat" ? message.slice(0, 60) : conv.title } }),
  ]);

  return NextResponse.json({ reply, conversationId: conv.id, messageId: assistantMsg.id });
}
