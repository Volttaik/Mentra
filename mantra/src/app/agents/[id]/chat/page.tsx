"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Brain, Loader2, BookOpen, MessageSquare, Sparkles, X, Trash2, Upload } from "lucide-react";
import UniversalChat, { UCMessage, UCConversation } from "@/components/chat/UniversalChat";
import ChatPageWrapper from "@/components/chat/ChatPageWrapper";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface RawMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  mediaType?: string | null;
  mediaUrl?: string | null;
  voiceDuration?: number | null;
  createdAt: string;
}

interface RawConversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: { content: string; role: string }[];
}

interface Agent {
  id: string;
  name: string;
  subject: string;
  domain: string;
  avatarUrl: string | null;
  knowledgeFiles: { id: string; name: string; size: number }[];
}

const QUICK_PROMPTS = [
  { label: "My Stacks", msg: "Show me my stacks", icon: BookOpen },
  { label: "My Articles", msg: "What articles have I written?", icon: MessageSquare },
  { label: "Research Task", msg: "Help me research a topic from Mentra stacks", icon: Sparkles },
];

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function KnowledgePanel({ agent, onClose, onUpload, uploading }: {
  agent: Agent;
  onClose: () => void;
  onUpload: (file: File) => void;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 300 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="fixed right-0 top-[64px] bottom-0 w-72 bg-surface-container-low border-l border-outline-variant/20 flex flex-col z-30 shadow-xl"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10 shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-secondary" />
          <span className="font-manrope font-semibold text-sm text-primary">Knowledge Files</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        {agent.knowledgeFiles.length === 0 ? (
          <div className="text-center py-8 text-on-surface-variant/50 text-xs">No files yet</div>
        ) : agent.knowledgeFiles.map(f => (
          <div key={f.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-surface-container/60 text-xs">
            <BookOpen className="w-3.5 h-3.5 text-secondary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="truncate text-on-surface font-medium">{f.name}</p>
              <p className="text-on-surface-variant/60">{fmtBytes(f.size)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-outline-variant/10 shrink-0">
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-secondary-container/30 hover:bg-secondary-container/50 text-xs font-medium text-on-surface transition-colors">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          Upload file
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) { onUpload(f); e.target.value = ""; } }} />
      </div>
    </motion.div>
  );
}

function AgentChatInner() {
  const { status } = useSession();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<RawConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RawMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  useEffect(() => {
    if (!id || status !== "authenticated") return;
    fetch(`/api/custom-agents/${id}`).then(r => r.json()).then(setAgent);
    fetch(`/api/custom-agents/${id}/conversations`).then(r => r.json()).then(data => setConversations(Array.isArray(data) ? data : []));
  }, [id, status]);

  const loadConversation = useCallback(async (convId: string) => {
    setLoadingMsgs(true);
    setActiveConvId(convId);
    const data = await fetch(`/api/custom-agents/${id}/conversations/${convId}`).then(r => r.json());
    setMessages(data.messages || []);
    setLoadingMsgs(false);
  }, [id]);

  const newConversation = async () => {
    const data = await fetch(`/api/custom-agents/${id}/conversations`, { method: "POST" }).then(r => r.json());
    setConversations(prev => [data, ...prev]);
    setActiveConvId(data.id);
    setMessages([]);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/custom-agents/${id}/conversations/${convId}`, { method: "DELETE" });
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) { setActiveConvId(null); setMessages([]); }
  };

  const handleSend = async ({ content, imageUrl, voiceUrl, voiceDuration }: {
    content: string; imageUrl?: string | null; voiceUrl?: string | null; voiceDuration?: number;
  }) => {
    if ((!content.trim() && !imageUrl && !voiceUrl) || sending) return;
    const text = content.trim();

    let convId = activeConvId;
    if (!convId) {
      const data = await fetch(`/api/custom-agents/${id}/conversations`, { method: "POST" }).then(r => r.json());
      convId = data.id;
      setConversations(prev => [{ ...data, messages: [] }, ...prev]);
      setActiveConvId(convId);
    }

    if (voiceUrl) {
      const tempMsg: RawMessage = { id: "tmp-voice-" + Date.now(), role: "user", content: "", mediaType: "voice", mediaUrl: voiceUrl, voiceDuration: voiceDuration ?? null, createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, tempMsg]);
      return;
    }

    const tempMsg: RawMessage = { id: "tmp-" + Date.now(), role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setSending(true);
    try {
      const res = await fetch(`/api/custom-agents/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: convId }),
      });
      const data = await res.json();
      if (!res.ok) return;
      if (data.conversationId && data.conversationId !== activeConvId) {
        setActiveConvId(data.conversationId);
        setConversations(prev => {
          const exists = prev.find(c => c.id === data.conversationId);
          if (!exists) return [{ id: data.conversationId, title: text.slice(0, 60), updatedAt: new Date().toISOString(), messages: [] }, ...prev];
          return prev;
        });
      }
      const assistantMsg: RawMessage = { id: data.messageId ?? "resp-" + Date.now(), role: "assistant", content: data.reply, createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setSending(false);
    }
  };

  const uploadKnowledgeFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    await fetch(`/api/custom-agents/${id}/files`, { method: "POST", body: fd });
    const updated = await fetch(`/api/custom-agents/${id}`).then(r => r.json());
    setAgent(updated);
    setUploading(false);
  };

  if (!agent) return (
    <ChatPageWrapper>
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    </ChatPageWrapper>
  );

  const ucMessages: UCMessage[] = messages.map(m => ({
    id: m.id,
    role: m.role,
    content: m.content,
    mediaType: (m.mediaType as "image" | "voice" | null) ?? null,
    mediaUrl: m.mediaUrl ?? null,
    voiceDuration: m.voiceDuration ?? null,
    createdAt: m.createdAt,
  }));

  const ucConversations: UCConversation[] = conversations.map(c => ({
    id: c.id, title: c.title, updatedAt: c.updatedAt,
    preview: c.messages?.[0]?.content,
  }));

  const quickNodes = !activeConvId && messages.length === 0 ? (
    <>
      {QUICK_PROMPTS.map(p => (
        <button key={p.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl elevated-surface text-[12px] text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/20">
          <p.icon className="h-3.5 w-3.5" /> {p.label}
        </button>
      ))}
    </>
  ) : null;

  const knowledgeBtn = (
    <button
      onClick={() => setKnowledgeOpen(v => !v)}
      className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
        knowledgeOpen
          ? "bg-secondary-container border-secondary/30 text-on-secondary-container"
          : "border-outline-variant/20 text-on-surface-variant hover:bg-surface-container hover:text-primary"
      )}
    >
      <BookOpen className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Files ({agent.knowledgeFiles.length})</span>
    </button>
  );

  return (
    <ChatPageWrapper>
      <div className="relative flex-1 flex flex-col overflow-hidden">
        <UniversalChat
          mode="custom-agent"
          title={agent.name}
          subtitle={agent.subject}
          headerIcon={<Brain className="w-3.5 h-3.5 text-on-secondary-container" />}
          headerRight={knowledgeBtn}
          messages={ucMessages}
          messagesLoading={loadingMsgs}
          conversations={ucConversations}
          activeConvId={activeConvId}
          onNewConversation={newConversation}
          onSelectConversation={loadConversation}
          onDeleteConversation={deleteConversation}
          onSend={handleSend}
          sending={sending}
          isThinking={sending}
          thinkingIcon={<Brain className="w-3.5 h-3.5 text-secondary" />}
          enableImages={true}
          enableVoice={true}
          enableMentions={true}
          emptyIcon={<Brain className="h-7 w-7 text-secondary" />}
          emptyTitle={`Chat with ${agent.name}`}
          emptySubtitle="I have full access to your stacks, articles, and knowledge base. Ask me anything."
          emptyActions={quickNodes ?? undefined}
          inputPlaceholder={`Ask ${agent.name}…`}
        />
        <AnimatePresence>
          {knowledgeOpen && (
            <KnowledgePanel
              agent={agent}
              onClose={() => setKnowledgeOpen(false)}
              onUpload={uploadKnowledgeFile}
              uploading={uploading}
            />
          )}
        </AnimatePresence>
      </div>
    </ChatPageWrapper>
  );
}

export default function AgentChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
      </div>
    }>
      <AgentChatInner />
    </Suspense>
  );
}
