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

const CAPABILITIES = {
  version: "1.0",
  name: "Mentra AI Agent",
  description: "Personal AI agent with full platform access",
  intents: [
    "getMyStats", "getStackDetails", "searchStacks",
    "createStackFlow", "addStackToFlow", "listMyFlows",
    "listMyCommunities", "contributeStackToCommunity",
    "updateStackMeta", "getNotifications", "general",
  ],
};

async function resolveUser(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    const key = await prisma.apiKey.findFirst({ where: { key: apiKey, isActive: true } });
    if (!key) return null;
    await prisma.apiKey.update({ where: { id: key.id }, data: { lastUsed: new Date(), requests: { increment: 1 } } });
    return await prisma.user.findUnique({ where: { id: key.userId } });
  }
  const session = await auth();
  if (!session?.user?.id) return null;
  return await prisma.user.findUnique({ where: { id: session.user.id } });
}

async function handleIntent(intent: string, args: any, user: any) {
  switch (intent) {
    case "getMyStats": {
      const [stackCount, totalStars, totalViews, credits] = await Promise.all([
        prisma.stack.count({ where: { ownerId: user.id } }),
        prisma.stackStar.count({ where: { stack: { ownerId: user.id } } }),
        prisma.stack.aggregate({ where: { ownerId: user.id }, _sum: { views: true } }),
        user.aiCredits,
      ]);
      return { stackCount, totalStars, totalViews: totalViews._sum.views ?? 0, aiCredits: credits };
    }
    case "searchStacks": {
      const stacks = await prisma.stack.findMany({
        where: {
          isPublic: true,
          OR: [
            { title: { contains: args.query, mode: "insensitive" } },
            { description: { contains: args.query, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, slug: true, description: true, banner: true },
        take: 5,
      });
      return { stacks };
    }
    case "listMyFlows": {
      const flows = await prisma.stackFlow.findMany({
        where: { userId: user.id },
        include: { _count: { select: { items: true } } },
      });
      return { flows };
    }
    case "createStackFlow": {
      if (!args.name) return { error: "Flow name is required" };
      const flow = await prisma.stackFlow.create({
        data: { userId: user.id, name: args.name, description: args.description, emoji: args.emoji ?? "flow" },
      });
      return { flow, message: `Created Stack Flow "${flow.name}" successfully.` };
    }
    case "addStackToFlow": {
      if (!args.flowId || !args.stackId) return { error: "flowId and stackId required" };
      try {
        await prisma.stackFlowItem.create({ data: { flowId: args.flowId, stackId: args.stackId } });
        return { message: "Stack added to flow." };
      } catch { return { error: "Already in flow or invalid IDs." }; }
    }
    case "listMyCommunities": {
      const memberships = await prisma.communityMember.findMany({
        where: { userId: user.id },
        include: { community: { select: { id: true, name: true, slug: true, _count: { select: { members: true, stacks: true } } } } },
      });
      return { communities: memberships.map(m => ({ ...m.community, role: m.role })) };
    }
    case "contributeStackToCommunity": {
      if (!args.communitySlug || !args.stackId) return { error: "communitySlug and stackId required" };
      const community = await prisma.community.findUnique({ where: { slug: args.communitySlug } });
      if (!community) return { error: "Community not found" };
      const isMember = await prisma.communityMember.findFirst({ where: { communityId: community.id, userId: user.id } });
      if (!isMember) return { error: "You are not a member of this community" };
      try {
        await prisma.communityStack.create({ data: { communityId: community.id, stackId: args.stackId, addedBy: user.id } });
        return { message: `Stack contributed to ${community.name}.` };
      } catch { return { error: "Already contributed or invalid stack." }; }
    }
    case "getNotifications": {
      const notifs = await prisma.notification.findMany({
        where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 10,
      });
      return { notifications: notifs };
    }
    case "updateStackMeta": {
      if (!args.stackId) return { error: "stackId required" };
      const stack = await prisma.stack.findFirst({ where: { id: args.stackId, ownerId: user.id } });
      if (!stack) return { error: "Stack not found or not yours" };
      const updated = await prisma.stack.update({
        where: { id: args.stackId },
        data: { title: args.title ?? stack.title, description: args.description ?? stack.description },
      });
      return { stack: updated, message: "Stack updated." };
    }
    default:
      return null;
  }
}

export async function GET() {
  return NextResponse.json(CAPABILITIES);
}

export async function POST(req: Request) {
  const user = await resolveUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if ((user.aiCredits ?? 0) <= 0) {
    return NextResponse.json({
      reply: "You've run out of AI credits. Head to Settings → AI Agent to top up.",
      intent: "general",
      data: null,
      agentName: user.agentName ?? "Mia",
      creditsEmpty: true,
    }, { status: 402 });
  }

  const { message, context, stackSlug } = await req.json();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const agentName = user.agentName ?? "Mia";

  let stackContextBlock = "";
  if (stackSlug) {
    const targetStack = await prisma.stack.findUnique({
      where: { slug: stackSlug },
      select: { id: true, isPublic: true, ownerId: true },
    });
    if (targetStack && (targetStack.isPublic || targetStack.ownerId === user.id)) {
      const assembled = await assembleStackContent(targetStack.id);
      if (assembled) {
        stackContextBlock = `\n\nYou are currently on the stack page for "${assembled.title}". The user is studying this stack. You have read all of its content:\n\n${assembled.richContext}\n\nUse this knowledge to give specific, accurate answers about this stack's content.`;
      }
    }
  }

  const systemPrompt = `You are ${agentName}, a personal AI agent for ${user.name} on Mentra — an academic knowledge platform.
You have full access to the user's account. When the user asks you to perform an action, respond with JSON in this exact format:
{"intent": "<intent>", "args": {<args>}, "reply": "<friendly message>"}

Available intents: ${CAPABILITIES.intents.join(", ")}
- getMyStats: {} — returns stack count, stars, views, credits
- searchStacks: {"query": "..."} — search public stacks  
- listMyFlows: {} — list user's Stack Flows
- createStackFlow: {"name": "...", "description": "..."} — create a new Stack Flow
- addStackToFlow: {"flowId": "...", "stackId": "..."} — add a stack to a flow
- listMyCommunities: {} — list communities the user is in
- contributeStackToCommunity: {"communitySlug": "...", "stackId": "..."} — contribute a stack
- getNotifications: {} — get recent notifications
- updateStackMeta: {"stackId": "...", "title": "...", "description": "..."} — update stack info
- general: {} — for general questions, just reply naturally

If the user is asking a general question, use intent "general".
Context: ${context ? JSON.stringify(context) : "none"}${stackContextBlock}`;

  try {
    const groq = getGroq();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.4,
      max_tokens: 512,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    let parsed: any = { intent: "general", args: {}, reply: raw };

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch { /* keep raw as reply */ }

    let actionResult = null;
    if (parsed.intent && parsed.intent !== "general") {
      actionResult = await handleIntent(parsed.intent, parsed.args ?? {}, user);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { aiCredits: { decrement: 1 } },
    });

    return NextResponse.json({
      reply: parsed.reply ?? raw,
      intent: parsed.intent,
      data: actionResult,
      agentName,
      creditsRemaining: Math.max(0, (user.aiCredits ?? 1) - 1),
    });
  } catch (e: any) {
    return NextResponse.json({ error: "Agent error", detail: e?.message }, { status: 500 });
  }
}
