import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const msgSelect = {
  id: true, conversationId: true, senderId: true, content: true,
  isViewOnce: true, viewedAt: true, editedAt: true, deletedAt: true,
  replyToId: true, createdAt: true, mediaType: true, mediaUrl: true, voiceDuration: true,
  sender: { select: { id: true, name: true, username: true, image: true } },
  replyTo: {
    select: {
      id: true, content: true, deletedAt: true, isViewOnce: true,
      mediaType: true, mediaUrl: true,
      sender: { select: { id: true, name: true } },
    },
  },
};

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const convo = await prisma.directConversation.findFirst({
    where: { id: params.id, OR: [{ user1Id: session.user.id }, { user2Id: session.user.id }] },
  });
  if (!convo) return new Response("Not found", { status: 404 });

  const encoder = new TextEncoder();
  let closed = false;
  let pollInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); } catch { closed = true; }
      };

      const initial = await prisma.directMessage.findMany({
        where: { conversationId: params.id },
        orderBy: { createdAt: "asc" },
        take: 60,
        select: msgSelect,
      });
      send({ type: "init", messages: initial });

      let lastPollAt = new Date();

      pollInterval = setInterval(async () => {
        if (closed) { if (pollInterval) clearInterval(pollInterval); return; }
        try {
          const pollTime = lastPollAt;
          lastPollAt = new Date();
          const updates = await prisma.directMessage.findMany({
            where: {
              conversationId: params.id,
              OR: [
                { createdAt: { gt: pollTime } },
                { editedAt: { gt: pollTime } },
                { deletedAt: { gt: pollTime } },
                { viewedAt: { gt: pollTime } },
              ],
            },
            orderBy: { createdAt: "asc" },
            select: msgSelect,
          });
          if (updates.length > 0) send({ type: "update", messages: updates });
        } catch { /* ignore transient db errors */ }
      }, 1500);

      req.signal.addEventListener("abort", () => {
        closed = true;
        if (pollInterval) clearInterval(pollInterval);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
    cancel() {
      closed = true;
      if (pollInterval) clearInterval(pollInterval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
