"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, BarChart2, Zap, MessageSquare } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import UniversalChat, { UCMessage, UCConversation } from "@/components/chat/UniversalChat";

interface RawMessage {
  id?: string;
  role: "user" | "agent";
  content: string;
  imageUrl?: string;
  data?: Record<string, number>;
}

interface RawConversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: { content: string; role: string }[];
}

const QUICK_ACTIONS = [
  { label: "My Stats", message: "Show me my stats", icon: BarChart2 },
  { label: "My Flows", message: "List my Stack Flows", icon: Zap },
  { label: "My Communities", message: "What communities am I in?", icon: MessageSquare },
];

function AgentPageInner() {
  const { status } = useSession();
  const router = useRouter();

  const [agentName, setAgentName] = useState("Mia");
  const [conversations, setConversations] = useState<RawConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RawMessage[]>([]);
  const [loadingConvo, setLoadingConvo] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [pendingQuickMsg, setPendingQuickMsg] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/agent").then(r => r.json()).then(d => setAgentName(d.name ?? "Mia")).catch(() => {});
    fetch("/api/agent/conversations")
      .then(r => r.json())
      .then(d => { setConversations(d.conversations ?? []); setLoadingHistory(false); })
      .catch(() => setLoadingHistory(false));
  }, [status]);

  const loadConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setLoadingConvo(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/agent/conversations/${id}`);
      const data = await res.json();
      const msgs: RawMessage[] = (data.conversation?.messages ?? []).map((m: { id: string; role: string; content: string; imageUrl?: string }) => ({
        id: m.id,
        role: m.role as "user" | "agent",
        content: m.content,
        imageUrl: m.imageUrl ?? undefined,
      }));
      setMessages(msgs);
    } finally {
      setLoadingConvo(false);
    }
  }, []);

  const startNewChat = useCallback(async () => {
    const res = await fetch("/api/agent/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Chat" }),
    });
    const data = await res.json();
    const convo: RawConversation = { ...data.conversation, messages: [] };
    setConversations(prev => [convo, ...prev]);
    setActiveId(convo.id);
    setMessages([]);
  }, []);

  const deleteConversation = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/agent/conversations/${id}`, { method: "DELETE" });
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
  }, [activeId]);

  const handleSend = useCallback(async ({ content, imageUrl }: { content: string; imageUrl?: string | null }) => {
    if ((!content.trim() && !imageUrl) || sending) return;

    let convId = activeId;
    if (!convId) {
      const res = await fetch("/api/agent/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: content.slice(0, 60) || "Image Chat" }),
      });
      const data = await res.json();
      convId = data.conversation.id;
      setConversations(prev => [{ ...data.conversation, messages: [] }, ...prev]);
      setActiveId(convId);
    }

    const userMsg: RawMessage = { role: "user", content: content || "Image sent", imageUrl: imageUrl ?? undefined };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    await fetch(`/api/agent/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addMessage: { role: "user", content: userMsg.content, imageUrl },
        ...(conversations.find(c => c.id === convId)?.title === "New Chat" && content ? { title: content.slice(0, 60) } : {}),
      }),
    });

    try {
      const body: Record<string, string> = { message: content || "What's in this image?", conversationId: convId! };
      if (imageUrl) body.image = imageUrl;
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setAgentName(data.agentName ?? agentName);
      const agentReply = data.reply ?? "Sorry, I couldn't process that.";
      const agentMsg: RawMessage = { role: "agent", content: agentReply, ...(data.data ? { data: data.data } : {}) };
      setMessages(prev => [...prev, agentMsg]);
      setConversations(prev => prev.map(c =>
        c.id === convId
          ? { ...c, updatedAt: new Date().toISOString(), messages: [{ role: "agent", content: agentReply }] }
          : c
      ));
    } catch {
      setMessages(prev => [...prev, { role: "agent", content: "Something went wrong. Please try again." }]);
    } finally {
      setSending(false);
    }
  }, [sending, agentName, activeId, conversations]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
      </div>
    );
  }

  const ucMessages: UCMessage[] = messages.map((m, i) => ({
    id: m.id ?? `local-${i}`,
    role: m.role === "agent" ? "assistant" : "user",
    content: m.content,
    imageUrl: m.imageUrl ?? null,
  }));

  const ucConversations: UCConversation[] = conversations.map(c => ({
    id: c.id,
    title: c.title,
    updatedAt: c.updatedAt,
    preview: c.messages[0]?.content,
  }));

  const quickActionNodes = (
    <>
      {QUICK_ACTIONS.map(({ label, message, icon: Icon }) => (
        <button key={label}
          onClick={() => setPendingQuickMsg(message)}
          className="flex items-center gap-2 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/10 rounded-full text-xs font-medium text-on-surface-variant hover:text-primary transition-all">
          <Icon className="w-3.5 h-3.5" /> {label}
        </button>
      ))}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <UniversalChat
        mode="agent"
        title={agentName}
        subtitle="Your personal AI agent"
        headerIcon={<Sparkles className="w-3.5 h-3.5 text-on-secondary-container" />}
        messages={ucMessages}
        messagesLoading={loadingConvo}
        conversations={ucConversations}
        activeConvId={activeId}
        onNewConversation={startNewChat}
        onSelectConversation={loadConversation}
        onDeleteConversation={deleteConversation}
        conversationsLoading={loadingHistory}
        onSend={async ({ content, imageUrl }) => {
          const msg = pendingQuickMsg ?? content;
          setPendingQuickMsg(null);
          await handleSend({ content: msg, imageUrl });
        }}
        sending={sending}
        isThinking={sending}
        thinkingIcon={<Sparkles className="w-3.5 h-3.5 text-on-secondary-container" />}
        enableImages={true}
        enableVoice={false}
        enableMentions={false}
        emptyIcon={<Sparkles className="w-7 h-7 text-on-secondary-container" />}
        emptyTitle={`Hi, I'm ${agentName}`}
        emptySubtitle="Ask me about your stacks, communities, stats — or anything."
        emptyActions={quickActionNodes}
        inputPlaceholder={`Message ${agentName}…`}
      />
    </div>
  );
}

export default function AgentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
      </div>
    }>
      <AgentPageInner />
    </Suspense>
  );
}
