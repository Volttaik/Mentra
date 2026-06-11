"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Brain, ChevronLeft, PanelLeft, PanelLeftClose,
  Plus, Trash2, BookOpen, Download, Loader2, Upload,
  MessageSquare, X, Paperclip, Sparkles,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
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

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center">
        <Brain className="h-3.5 w-3.5 text-secondary" />
      </div>
      <div className="ml-2 px-3 py-2 rounded-2xl bg-surface-container-low border border-outline-variant/15">
        <div className="thinking-dots flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-secondary/60 inline-block" />
          <span className="w-1.5 h-1.5 rounded-full bg-secondary/60 inline-block" />
          <span className="w-1.5 h-1.5 rounded-full bg-secondary/60 inline-block" />
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, agentName }: { msg: Message; agentName: string }) {
  const isUser = msg.role === "user";
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      className={cn("flex items-start gap-3 px-4 py-2", isUser ? "flex-row-reverse" : "flex-row")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center shrink-0 mt-0.5">
          <Brain className="h-3.5 w-3.5 text-secondary" />
        </div>
      )}
      <div className={cn("max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed", isUser
        ? "bg-primary text-on-primary rounded-tr-sm"
        : "bg-surface-container-low border border-outline-variant/15 text-on-surface rounded-tl-sm"
      )}>
        <p className="whitespace-pre-wrap">{msg.content}</p>
        <p className={cn("text-[10px] mt-1 opacity-60", isUser ? "text-right" : "text-left")}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
}

function AgentChatInner() {
  const { data: session, status } = useSession();
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  const [uploading, setUploading] = useState(false);
  const [knowledgeOpen, setKnowledgeOpen] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);

  useEffect(() => {
    if (!id || status !== "authenticated") return;
    fetch(`/api/custom-agents/${id}`).then(r => r.json()).then(setAgent);
    fetch(`/api/custom-agents/${id}/conversations`).then(r => r.json()).then(data => setConversations(Array.isArray(data) ? data : []));
  }, [id, status]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

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

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    const tempMsg: Message = { id: "tmp-" + Date.now(), role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setSending(true);
    try {
      const res = await fetch(`/api/custom-agents/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId: activeConvId }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed"); return; }
      if (data.conversationId && data.conversationId !== activeConvId) {
        setActiveConvId(data.conversationId);
        setConversations(prev => {
          const exists = prev.find(c => c.id === data.conversationId);
          if (!exists) return [{ id: data.conversationId, title: text.slice(0, 60), updatedAt: new Date().toISOString(), messages: [] }, ...prev];
          return prev;
        });
      }
      const assistantMsg: Message = { id: data.messageId, role: "assistant", content: data.reply, createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setSending(false);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    await fetch(`/api/custom-agents/${id}/files`, { method: "POST", body: fd });
    const agent = await fetch(`/api/custom-agents/${id}`).then(r => r.json());
    setAgent(agent);
    setUploading(false);
  };

  if (!agent) return (
    <div className="min-h-screen app-ambient-bg flex items-center justify-center">
      <Navbar />
      <Loader2 className="h-8 w-8 animate-spin text-secondary" />
    </div>
  );

  const QUICK_PROMPTS = [
    { label: "My Stacks", msg: "Show me my stacks", icon: BookOpen },
    { label: "My Flows", msg: "List my stack flows", icon: Sparkles },
    { label: "My Articles", msg: "What articles have I written?", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen app-ambient-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px)", marginTop: "64px", position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>

        {/* Sidebar overlay backdrop on mobile */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-black/40 z-10" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="h-full elevated-surface border-r border-outline-variant/20 flex flex-col overflow-hidden shrink-0 md:relative fixed left-0 top-0 bottom-0 z-20" style={{ width: 280 }}>
              <div className="p-4 border-b border-outline-variant/15">
                <Link href="/agents" className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-4 text-sm">
                  <ChevronLeft className="h-4 w-4" /> All Agents
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center">
                    <span className="text-sm font-bold text-secondary font-manrope">{agent.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-on-surface font-manrope truncate">{agent.name}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{agent.subject}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <button onClick={newConversation} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary-container/30 hover:bg-secondary-container/50 text-xs font-medium text-on-surface transition-colors mb-3">
                  <Plus className="h-4 w-4" /> New Chat
                </button>
                {conversations.map(conv => (
                  <div key={conv.id} onClick={() => loadConversation(conv.id)}
                    className={cn("group flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-colors text-xs", activeConvId === conv.id ? "bg-secondary-container/40 text-on-surface" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface")}>
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{conv.title}</span>
                    <button onClick={e => deleteConversation(conv.id, e)} className="opacity-0 group-hover:opacity-100 hover:text-error transition-all">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-outline-variant/15">
                <button onClick={() => setKnowledgeOpen(true)} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface-container-high text-xs text-on-surface-variant hover:text-on-surface transition-colors">
                  <BookOpen className="h-4 w-4" />
                  Knowledge Files ({agent.knowledgeFiles.length})
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/15 bg-surface-container-lowest/80 backdrop-blur-sm">
            <button onClick={() => setSidebarOpen(v => !v)} className="text-on-surface-variant hover:text-on-surface transition-colors">
              {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeft className="h-5 w-5" />}
            </button>
            <h2 className="font-semibold font-manrope text-on-surface text-sm">{agent.name}</h2>
            <span className="text-[11px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">{agent.subject}</span>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {!activeConvId && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center mx-auto mb-4">
                    <Brain className="h-8 w-8 text-secondary" />
                  </div>
                  <h3 className="font-bold font-manrope text-on-surface text-lg mb-1">Chat with {agent.name}</h3>
                  <p className="text-sm text-on-surface-variant max-w-xs">I have full access to your stacks, flows, and articles. Ask me anything.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_PROMPTS.map(p => (
                    <button key={p.label} onClick={() => { setInput(p.msg); textareaRef.current?.focus(); }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl elevated-surface text-xs text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/20">
                      <p.icon className="h-3.5 w-3.5" /> {p.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map(msg => <MessageBubble key={msg.id} msg={msg} agentName={agent.name} />)}
                {sending && <ThinkingDots />}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-outline-variant/15 bg-surface-container-lowest/80 backdrop-blur-sm">
            <div className="elevated-surface rounded-2xl flex items-end gap-2 p-2">
              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-on-surface-variant hover:text-secondary transition-colors shrink-0">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
              </button>
              <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Message ${agent.name}…`} rows={1}
                style={{ resize: "none", minHeight: "40px", maxHeight: "120px" }}
                className="flex-1 bg-transparent outline-none text-sm text-on-surface placeholder:text-on-surface-variant/50 py-2"
              />
              <button onClick={sendMessage} disabled={!input.trim() || sending}
                className="p-2.5 rounded-xl bg-primary text-on-primary disabled:opacity-40 transition-all hover:opacity-90 shrink-0">
                <Send className="h-4 w-4" />
              </button>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.md,.pdf" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
          </div>
        </div>
      </div>

      {/* Knowledge files drawer */}
      <AnimatePresence>
        {knowledgeOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="elevated-surface-strong rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold font-manrope text-on-surface">Knowledge Files</h3>
                <button onClick={() => setKnowledgeOpen(false)} className="text-on-surface-variant hover:text-on-surface"><X className="h-5 w-5" /></button>
              </div>
              <p className="text-sm text-on-surface-variant mb-4">Upload files to give {agent.name} specialised knowledge. Supports .txt and .md files.</p>
              {agent.knowledgeFiles.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant text-sm">No files yet</div>
              ) : (
                <div className="space-y-2 mb-4">
                  {agent.knowledgeFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
                      <BookOpen className="h-4 w-4 text-secondary shrink-0" />
                      <span className="text-sm text-on-surface flex-1 truncate">{f.name}</span>
                      <span className="text-[11px] text-on-surface-variant">{(f.size / 1024).toFixed(0)}KB</span>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => { fileInputRef.current?.click(); setKnowledgeOpen(false); }}
                className="btn-primary w-full py-3 text-sm gap-2">
                <Upload className="h-4 w-4" /> Upload File
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AgentChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" /></div>}>
      <AgentChatInner />
    </Suspense>
  );
}
