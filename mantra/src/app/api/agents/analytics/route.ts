import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const [totalConversations, user, creditTxns, agents] = await Promise.all([
    prisma.customAgentConversation.count({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { aiCredits: true } }),
    prisma.creditTransaction.findMany({
      where: { userId, amount: { lt: 0 } },
      select: { amount: true, createdAt: true },
    }),
    prisma.customAgent.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        subject: true,
        conversations: {
          select: {
            messages: { select: { id: true, createdAt: true } },
          },
        },
      },
    }),
  ]);

  const allMessages = agents.flatMap(a =>
    a.conversations.flatMap(c => c.messages)
  );
  const totalMessages = allMessages.length;
  const creditsUsed = Math.abs(creditTxns.reduce((sum, t) => sum + t.amount, 0));
  const creditsBalance = user?.aiCredits ?? 0;

  const now = new Date();
  const last30Days: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = allMessages.filter(m => m.createdAt.toISOString().split("T")[0] === dateStr).length;
    last30Days.push({ date: dateStr, count });
  }

  let streakDays = 0;
  for (let i = last30Days.length - 1; i >= 0; i--) {
    if (last30Days[i].count > 0) streakDays++;
    else break;
  }

  const topAgents = agents
    .map(a => ({
      agentId: a.id,
      agentName: a.name,
      subject: a.subject,
      messageCount: a.conversations.reduce((sum, c) => sum + c.messages.length, 0),
    }))
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 5);

  return NextResponse.json({
    totalMessages,
    totalConversations,
    creditsUsed,
    creditsBalance,
    streakDays,
    messagesByDay: last30Days,
    topAgents,
  });
}
