"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, ArrowLeft, Loader2, Image as ImageIcon,
  BarChart2, Zap, MessageSquare, X, Paperclip,
  Plus, Trash2, MessageCircle, PanelLeftClose, PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Navbar from "@/components/layout/Navbar";

interface Message {
  id?: string;
  role: "user" | "agent";
  content: string;
  imageUrl?: string;
}

interface Conversation {
  id: string;
  title: string;
  updatedAt: string;
  messages: { content: string; role: string }[];
}

function _StatCard({ data }: { data: Record<string, number> }) {
  if (!data) return null;
  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {[
        { label: "Stacks", value: data.stackCount },
        { label: "Stars", value: data.totalStars },
        { label: "Views", value: data.totalViews },
        { label: "Credits", value: data.aiCredits },
      ].map(({ label, value }) => (
        <div key={label} className="bg-background rounded-xl p-3 text-center border border-outline-variant/10">
          <p className="text-xl font-bold text-primary font-manrope">{value ?? 0}</p>
          <p className="text-xs text-on-surface-variant">{label}</p>
        </div>
      ))}
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "My Stats", message: "Show me my stats", icon: BarChart2 },
  { label: "My Flows", message: "List my Stack Flows", icon: Zap },
  { label: "My Communities", message: "What communities am I in?", icon: MessageSquare },
];

function formatRelative(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function AgentPage() {
  const { status } = useSession();
  const router = useRouter();

  const [agentName, setAgentName] = useState("Mia");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConvo, setLoadingConvo] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/agent").then(r => r.json()).then(d => setAgentName(d.name ?? "Mia")).catch(() => {});
    fetch("/api/agent/conversations")
      .then(r => r.json())
      .then(d => { setConversations(d.conversations ?? []); setLoadingHistory(false); })
      .catch(() => setLoadingHistory(false));
  }, [status]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversation = useCallback(async (id: string) => {
    setActiveId(id);
    setLoadingConvo(true);
    setMessages([]);
    try {
      const res = await fetch(`/api/agent/conversations/${id}`);
      const data = await res.json();
      const msgs: Message[] = (data.conversation?.messages ?? []).map((m: { id: string; role: string; content: string; imageUrl?: string }) => ({
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
    const convo: Conversation = { ...data.conversation, messages: [] };
    setConversations(prev => [convo, ...prev]);
    setActiveId(convo.id);
    setMessages([]);
    inputRef.current?.focus();
  }, []);

  const deleteConversation = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/agent/conversations/${id}`, { method: "DELETE" });
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  }, [activeId]);

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = e => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const sendMessage = useCallback(async () => {
    if ((!input.trim() && !imageFile) || sending) return;

    let convId = activeId;

    if (!convId) {
      const res = await fetch("/api/agent/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: input.slice(0, 60) || "Image Chat" }),
      });
      const data = await res.json();
      convId = data.conversation.id;
      setConversations(prev => [{ ...data.conversation, messages: [] }, ...prev]);
      setActiveId(convId);
    }

    const msg = input.trim();
    const imgPreview = imagePreview;
    setInput("");
    clearImage();

    const userMsg: Message = { role: "user", content: msg || "📷 Image sent", imageUrl: imgPreview ?? undefined };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    await fetch(`/api/agent/conversations/${convId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addMessage: { role: "user", content: userMsg.content, imageUrl: imgPreview },
        ...(conversations.find(c => c.id === convId)?.title === "New Chat" && msg
          ? { title: msg.slice(0, 60) }
          : {}),
      }),
    });

    try {
      const body: Record<string, string> = { message: msg || "What's in this image?" };
      if (imgPreview) body.image = imgPreview;

      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setAgentName(data.agentName ?? agentName);

      const agentReply = data.reply ?? "Sorry, I couldn't process that.";
      const agentMsg: Message = {
        role: "agent",
        content: agentReply,
        ...(data.data ? { data: data.data } : {}),
      };
      setMessages(prev => [...prev, agentMsg]);

      await fetch(`/api/agent/conversations/${convId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addMessage: { role: "agent", content: agentReply } }),
      });

      setConversations(prev => prev.map(c =>
        c.id === convId
          ? { ...c, updatedAt: new Date().toISOString(), messages: [{ role: "agent", content: agentReply }] }
          : c
      ));
    } catch {
      setMessages(prev => [...prev, { role: "agent", content: "Something went wrong. Please try again." }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, sending, agentName, imageFile, imagePreview, activeId, conversations]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-secondary animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="relative flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>

        {/* Sidebar — overlays the chat, does not push it */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[1px]"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="absolute left-0 top-0 bottom-0 z-30 w-[260px] border-r border-outline-variant/10 bg-surface-container-low flex flex-col overflow-hidden shadow-xl"
              >
              <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10 shrink-0">
                <span className="font-manrope font-semibold text-sm text-primary">Conversations</span>
                <button
                  onClick={startNewChat}
                  className="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                  title="New chat"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
                {loadingHistory ? (
                  <div className="space-y-2 px-2 py-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-surface-container rounded-xl animate-pulse" />)}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <MessageCircle className="w-8 h-8 text-on-surface-variant/30 mb-2" />
                    <p className="text-xs text-on-surface-variant/50">No conversations yet</p>
                  </div>
                ) : (
                  conversations.map(c => (
                    <button
                      key={c.id}
                      onClick={() => loadConversation(c.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl transition-all group flex items-start gap-2",
                        activeId === c.id
                          ? "bg-secondary-container/60 text-on-secondary-container"
                          : "hover:bg-surface-container text-on-surface"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{c.title}</p>
                        {c.messages[0] && (
                          <p className="text-[11px] text-on-surface-variant/60 truncate mt-0.5">
                            {c.messages[0].content}
                          </p>
                        )}
                        <p className="text-[10px] text-on-surface-variant/40 mt-0.5">{formatRelative(c.updatedAt)}</p>
                      </div>
                      <button
                        onClick={e => deleteConversation(c.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-error-container/20 hover:text-error text-on-surface-variant/40 shrink-0 transition-all mt-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </button>
                  ))
                )}
              </div>
            </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/10 shrink-0">
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarOpen(o => !o)}
              className="p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
              title={sidebarOpen ? "Hide history" : "Show history"}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-on-secondary-container" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-manrope font-bold text-sm text-primary">{agentName}</h1>
              <p className="text-[11px] text-on-surface-variant">Your personal AI agent</p>
            </div>
            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary rounded-xl text-xs font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> New chat
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {loadingConvo ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-secondary animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center pt-10 pb-6 text-center max-w-md mx-auto"
              >
                <div className="w-14 h-14 bg-secondary-container rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-on-secondary-container" />
                </div>
                <h2 className="font-manrope font-semibold text-lg text-primary mb-1">Hi, I&apos;m {agentName}</h2>
                <p className="text-sm text-on-surface-variant mb-6">
                  Ask me about your stacks, communities, stats — or anything.
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_ACTIONS.map(({ label, message, icon: Icon }) => (
                    <button
                      key={label}
                      onClick={() => { setInput(message); inputRef.current?.focus(); }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/10 rounded-full text-sm font-medium text-on-surface-variant hover:text-primary transition-all"
                    >
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id ?? i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={cn("flex gap-3 max-w-3xl", msg.role === "user" ? "ml-auto flex-row-reverse" : "")}
                  >
                    {msg.role === "agent" && (
                      <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center shrink-0 mt-1">
                        <Sparkles className="w-3.5 h-3.5 text-on-secondary-container" />
                      </div>
                    )}
                    <div className="space-y-1.5 max-w-[80%]">
                      {msg.imageUrl && (
                        <div className={cn("rounded-2xl overflow-hidden", msg.role === "user" ? "rounded-br-sm" : "rounded-bl-sm")}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={msg.imageUrl} alt="Attached" className="max-w-full max-h-60 object-contain bg-surface-container" />
                        </div>
                      )}
                      {msg.content && (
                        <div className={cn(
                          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
                          msg.role === "user"
                            ? "bg-secondary text-on-secondary rounded-br-sm"
                            : "bg-surface-container text-on-surface rounded-bl-sm"
                        )}>
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {sending && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 max-w-3xl">
                <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-on-secondary-container" />
                </div>
                <div className="bg-surface-container rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-secondary animate-spin" />
                  <span className="text-sm text-on-surface-variant">Thinking…</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Image preview strip */}
          {imagePreview && (
            <div className="px-4 pb-1 flex items-start gap-2">
              <div className="relative inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Preview" className="h-16 w-auto rounded-xl object-cover border border-outline-variant/20" />
                <button onClick={clearImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-error text-on-error rounded-full flex items-center justify-center">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="px-4 pb-4 pt-2 shrink-0">
            <div className="bg-surface-container rounded-2xl border border-outline-variant/10 shadow-sm overflow-hidden">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${agentName}…`}
                rows={1}
                className="w-full bg-transparent px-4 pt-3.5 pb-1 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none resize-none max-h-32 overflow-y-auto"
                style={{ minHeight: "44px" }}
              />
              <div className="flex items-center justify-between px-3 pb-3 pt-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                    title="Attach image"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-high transition-colors"
                    title="Send image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={(!input.trim() && !imageFile) || sending}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-on-secondary rounded-xl text-sm font-semibold font-manrope disabled:opacity-40 transition-all hover:opacity-90"
                >
                  {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send
                </button>
              </div>
            </div>
            <p className="text-center text-[11px] text-on-surface-variant/40 mt-2">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
