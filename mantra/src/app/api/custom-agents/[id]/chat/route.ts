import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { assembleStackContent } from "@/lib/stack-content";

export const dynamic = "force-dynamic";

function getGroq() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Groq = require("groq-sdk");
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function buildSystemPrompt(
  agent: { name: string; subject: string; level: string; domain: string; tone: string; personality: string | null },
  knowledge: string,
  userContext: string,
  platformContext: string,
  stackContext?: string
) {
  const toneMap: Record<string, string> = {
    patient: "You are patient and thorough. You explain step-by-step with many examples.",
    concise: "You are concise and direct. Get to the point, minimal fluff.",
    socratic: "You use the Socratic method. Guide the user to answers with probing questions.",
    friendly: "You are friendly, warm, and conversational. Encouraging and casual.",
    strict: "You are strict and rigorous. Hold high standards and demand precision.",
    motivational: "You are energetic, uplifting, and action-oriented.",
  };

  return `You are ${agent.name}, a specialized AI agent on Mentra — a collaborative academic knowledge platform.
Subject: ${agent.subject} | Level: ${agent.level} | Domain: ${agent.domain}
Communication style: ${toneMap[agent.tone] || toneMap.patient}
${agent.personality ? `\nPersonality: ${agent.personality}` : ""}

You have full access to the ENTIRE Mentra platform, not just one user's account. You can reference and discuss any publicly available stacks, articles, communities, and knowledge on the platform. You are different from the personal AI agent because you have a specialised subject focus AND platform-wide reach.

USER'S PERSONAL CONTEXT:
${userContext}

PLATFORM-WIDE CONTEXT (public data you can reference):
${platformContext}

${stackContext ? `\nYou are currently helping with a specific stack. Read this content carefully before responding:\n\n${stackContext}\n` : ""}

${knowledge ? `\nYour uploaded knowledge base:\n${knowledge}\n` : ""}

When helping users:
- You can search and reference any public stack on Mentra, not just the user's own stacks
- You can suggest relevant communities, articles, and learning resources from across the platform
- You can help create study materials, workspace content, quizzes, summaries based on any public content
- Reference specific stacks by name and suggest users explore them
- Always stay in character as ${agent.name}. Be helpful, accurate, and engaged.`;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { message, conversationId, stackSlug } = body;
  if (!message?.trim()) return NextResponse.json({ error: "Message required" }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { aiCredits: true, name: true },
  });
  if (!user || user.aiCredits < 1) return NextResponse.json({ error: "Not enough credits" }, { status: 402 });

  const agent = await prisma.customAgent.findFirst({
    where: {
      id: params.id,
      OR: [{ ownerId: session.user.id }, { subscriptions: { some: { userId: session.user.id } } }],
    },
    include: { knowledgeFiles: { select: { content: true, name: true } } },
  });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  // ── User's personal context ──────────────────────────────────────────────
  const [userStacks, userFlows, userArticles, userCommunities] = await Promise.all([
    prisma.stack.findMany({
      where: { ownerId: session.user.id },
      select: { title: true, description: true, slug: true, courseCode: true },
      take: 15,
    }),
    prisma.stackFlow.findMany({
      where: { userId: session.user.id },
      select: { name: true, description: true, emoji: true, _count: { select: { items: true } } },
      take: 8,
    }),
    prisma.article.findMany({
      where: { authorId: session.user.id, isPublished: true },
      select: { title: true, summary: true, slug: true },
      take: 8,
    }),
    prisma.communityMember.findMany({
      where: { userId: session.user.id },
      select: { community: { select: { name: true, slug: true } } },
      take: 8,
    }),
  ]);

  const userContext = [
    `Name: ${user.name}`,
    userStacks.length ? `My Stacks (${userStacks.length}): ${userStacks.map(s => `"${s.title}"${s.courseCode ? ` (${s.courseCode})` : ""}`).join(", ")}` : "No stacks yet",
    userFlows.length ? `My Stack Flows: ${userFlows.map(f => `${f.emoji} "${f.name}" (${f._count.items} stacks)`).join(", ")}` : "",
    userArticles.length ? `My Articles: ${userArticles.map(a => `"${a.title}"`).join(", ")}` : "",
    userCommunities.length ? `My Communities: ${userCommunities.map(c => c.community.name).join(", ")}` : "",
  ].filter(Boolean).join("\n");

  // ── Platform-wide context (public data) ──────────────────────────────────
  const [publicStacks, allCommunities, trendingArticles, topStacks] = await Promise.all([
    // Recent public stacks across the whole platform
    prisma.stack.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      select: {
        title: true, slug: true, description: true, courseCode: true,
        university: true, department: true, views: true,
        owner: { select: { name: true, username: true } },
        tags: { select: { tag: { select: { name: true } } } },
        _count: { select: { stars: true } },
      },
      take: 30,
    }),
    // All public communities
    prisma.community.findMany({
      where: {},
      select: {
        name: true, slug: true, description: true,
        _count: { select: { members: true, stacks: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    // Recent published articles
    prisma.article.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      select: {
        title: true, slug: true, summary: true,
        author: { select: { name: true, username: true } },
      },
      take: 15,
    }),
    // Most starred/viewed stacks (trending)
    prisma.stack.findMany({
      where: { isPublic: true },
      orderBy: { views: "desc" },
      select: {
        title: true, slug: true, courseCode: true, views: true,
        owner: { select: { username: true } },
        _count: { select: { stars: true } },
      },
      take: 10,
    }),
  ]);

  const platformContext = [
    publicStacks.length > 0
      ? `PUBLIC STACKS ON MENTRA (${publicStacks.length} total shown):\n${publicStacks.map(s =>
          `• "${s.title}"${s.courseCode ? ` (${s.courseCode})` : ""}${s.university ? ` — ${s.university}` : ""}${s.department ? `, ${s.department}` : ""} by ${s.owner.name} [@${s.owner.username}] | tags: ${s.tags.map((t: { tag: { name: string } }) => t.tag.name).join(", ") || "none"} | ⭐${s._count.stars} 👁${s.views}`
        ).join("\n")}`
      : "",
    topStacks.length > 0
      ? `TRENDING STACKS (most viewed):\n${topStacks.map(s => `• "${s.title}"${s.courseCode ? ` (${s.courseCode})` : ""} by @${s.owner.username} — ⭐${s._count.stars} 👁${s.views}`).join("\n")}`
      : "",
    allCommunities.length > 0
      ? `COMMUNITIES (${allCommunities.length}):\n${allCommunities.map(c => `• "${c.name}" (${c.slug}) — ${c._count.members} members, ${c._count.stacks} stacks${c.description ? `: ${c.description.slice(0, 60)}` : ""}`).join("\n")}`
      : "",
    trendingArticles.length > 0
      ? `RECENT ARTICLES:\n${trendingArticles.map(a => `• "${a.title}" by ${a.author.name}${a.summary ? ` — ${a.summary.slice(0, 80)}` : ""}`).join("\n")}`
      : "",
  ].filter(Boolean).join("\n\n");

  // ── Optional: assemble specific stack context ─────────────────────────────
  let stackContext: string | undefined;
  if (stackSlug) {
    const targetStack = await prisma.stack.findUnique({
      where: { slug: stackSlug },
      select: { id: true, isPublic: true, ownerId: true },
    });
    if (targetStack && (targetStack.isPublic || targetStack.ownerId === session.user.id)) {
      const assembled = await assembleStackContent(targetStack.id);
      if (assembled) stackContext = assembled.richContext;
    }
  }

  const knowledge = agent.knowledgeFiles
    .map(f => (f.content ? `[${f.name}]\n${f.content}` : ""))
    .filter(Boolean)
    .join("\n\n---\n\n");

  // ── Conversation persistence ──────────────────────────────────────────────
  let conv;
  if (conversationId) {
    conv = await prisma.customAgentConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
    });
  }
  if (!conv) {
    conv = await prisma.customAgentConversation.create({
      data: { agentId: params.id, userId: session.user.id, title: message.slice(0, 60) },
    });
  }

  const history = await prisma.customAgentMessage.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  await prisma.customAgentMessage.create({
    data: { conversationId: conv.id, role: "user", content: message },
  });

  const messages = [
    { role: "system", content: buildSystemPrompt(agent, knowledge, userContext, platformContext, stackContext) },
    ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];

  const groq = getGroq();
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    max_tokens: 1536,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content || "I'm not sure how to respond to that.";

  const [assistantMsg] = await Promise.all([
    prisma.customAgentMessage.create({
      data: { conversationId: conv.id, role: "assistant", content: reply },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: { aiCredits: { decrement: 1 } },
    }),
    prisma.customAgentConversation.update({
      where: { id: conv.id },
      data: {
        updatedAt: new Date(),
        title: conv.title === "New Chat" ? message.slice(0, 60) : conv.title,
      },
    }),
  ]);

  return NextResponse.json({ reply, conversationId: conv.id, messageId: assistantMsg.id });
}
