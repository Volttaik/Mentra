"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp, Brain, ChevronLeft, PanelLeft, PanelLeftClose,
  Plus, Trash2, BookOpen, Upload, Loader2,
  MessageSquare, X, Paperclip, Sparkles,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { VerbThinkingIndicator, CopyBtn, renderMessage } from "@/components/chat/ChatPrimitives";
import ChatBackground from "@/components/chat/ChatBackground";

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


function AgentChatInner() {
  const { status } = useSession();
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
    if (textareaRef.current) textareaRef.current.style.height = "auto";
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
    const updated = await fetch(`/api/custom-agents/${id}`).then(r => r.json());
    setAgent(updated);
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
    { label: "My Articles", msg: "What articles have I written?", icon: MessageSquare },
    { label: "Research Task", msg: "Help me research a topic from Mentra stacks", icon: Sparkles },
  ];

  const agentIcon = <Brain className="w-3.5 h-3.5 text-secondary" />;

  return (
    <div className="min-h-screen app-ambient-bg flex flex-col">
      <Navbar />
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px)", marginTop: "64px", position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>

        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 bg-black/40 z-10" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="h-full bg-surface-container-low border-r border-outline-variant/20 flex flex-col overflow-hidden shrink-0 md:relative fixed left-0 top-0 bottom-0 z-20"
              style={{ width: 260 }}
            >
              <div className="p-4 border-b border-outline-variant/10">
                <Link href="/agents" className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors mb-4 text-xs">
                  <ChevronLeft className="h-3.5 w-3.5" /> All Agents
                </Link>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-secondary font-manrope">{agent.name[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-on-surface font-manrope truncate">{agent.name}</p>
                    <p className="text-[11px] text-on-surface-variant truncate">{agent.subject}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
                <button onClick={newConversation} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary-container/30 hover:bg-secondary-container/50 text-xs font-medium text-on-surface transition-colors mb-2">
                  <Plus className="h-3.5 w-3.5" /> New Chat
                </button>
                {conversations.map(conv => (
                  <div key={conv.id} onClick={() => loadConversation(conv.id)}
                    className={cn("group flex items-center gap-2 px-3 py-1.5 rounded-xl cursor-pointer transition-colors text-xs", activeConvId === conv.id ? "bg-secondary-container/40 text-on-surface" : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface")}>
                    <MessageSquare className="h-3 w-3 shrink-0" />
                    <span className="flex-1 truncate">{conv.title}</span>
                    <button onClick={e => deleteConversation(conv.id, e)} className="opacity-0 group-hover:opacity-100 hover:text-error transition-all">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-outline-variant/10">
                <button onClick={() => setKnowledgeOpen(true)} className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-surface-container-high text-xs text-on-surface-variant hover:text-on-surface transition-colors">
                  <BookOpen className="h-3.5 w-3.5" />
                  Knowledge Files ({agent.knowledgeFiles.length})
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <ChatBackground />
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-outline-variant/10 bg-surface-container-low/80 backdrop-blur-sm shrink-0">
            <button onClick={() => setSidebarOpen(v => !v)} className="text-on-surface-variant hover:text-on-surface transition-colors">
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-secondary font-manrope">{agent.name[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold font-manrope text-on-surface text-sm truncate">{agent.name}</h2>
              <p className="text-[10px] text-on-surface-variant truncate">{agent.subject}</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-secondary" />
              </div>
            ) : !activeConvId && messages.length === 0 ? (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-full gap-5 px-4">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center mx-auto mb-3">
                    <Brain className="h-7 w-7 text-secondary" />
                  </div>
                  <h3 className="font-bold font-manrope text-on-surface text-base mb-1">Chat with {agent.name}</h3>
                  <p className="text-[12.5px] text-on-surface-variant max-w-xs">I have full access to your stacks, articles, and knowledge base. Ask me anything.</p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {QUICK_PROMPTS.map(p => (
                    <button key={p.label} onClick={() => { setInput(p.msg); textareaRef.current?.focus(); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl elevated-surface text-[12px] text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/20">
                      <p.icon className="h-3.5 w-3.5" /> {p.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <>
                <AnimatePresence initial={false}>
                  {messages.map(msg => {
                    const isUser = msg.role === "user";
                    return (
                      <motion.div key={msg.id}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        className={cn("flex gap-2.5 group", isUser ? "flex-row-reverse" : "flex-row")}
                      >
                        {!isUser && (
                          <div className="w-7 h-7 rounded-full bg-secondary-container/60 border border-outline-variant/20 flex items-center justify-center shrink-0 mt-0.5">
                            <Brain className="h-3.5 w-3.5 text-secondary" />
                          </div>
                        )}
                        <div className={cn("max-w-[80%] space-y-1", isUser ? "items-end flex flex-col" : "")}>
                          <div className={cn(
                            "px-3.5 py-2.5 rounded-2xl",
                            isUser
                              ? "bg-primary text-on-primary rounded-tr-sm"
                              : "bg-surface-container border border-outline-variant/15 text-on-surface rounded-tl-sm"
                          )}>
                            {isUser
                              ? <p className="text-[12.5px] leading-relaxed">{msg.content}</p>
                              : renderMessage(msg.content)
                            }
                          </div>
                          <div className={cn("flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150", isUser ? "justify-end" : "justify-start")}>
                            <span className="text-[10px] text-on-surface-variant/30">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {!isUser && <CopyBtn text={msg.content} />}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <AnimatePresence>
                  {sending && <VerbThinkingIndicator agentIcon={agentIcon} />}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-outline-variant/10 bg-surface-container-low/80 backdrop-blur-sm shrink-0">
            <div className={cn(
              "rounded-2xl border bg-surface-container-lowest transition-all duration-200",
              input.trim() ? "border-secondary/30 shadow-sm" : "border-outline-variant/20"
            )}>
              <textarea ref={textareaRef} value={input}
                onChange={e => { setInput(e.target.value); const el = e.target; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={`Message ${agent.name}…`} rows={1}
                style={{ resize: "none", minHeight: "40px", maxHeight: "120px" }}
                className="w-full bg-transparent px-4 pt-3 pb-1 text-[13px] text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none"
              />
              <div className="flex items-center justify-between px-3 pb-3 pt-1">
                <button onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-xl text-on-surface-variant hover:text-secondary hover:bg-surface-container transition-colors">
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                </button>
                <AnimatePresence mode="wait">
                  <motion.button key={sending ? "wait" : "send"}
                    initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                      input.trim() && !sending
                        ? "bg-primary text-on-primary hover:opacity-90 shadow-sm"
                        : "bg-surface-container text-on-surface-variant/30"
                    )}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </motion.button>
                </AnimatePresence>
              </div>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" accept=".txt,.md,.pdf"
              onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
          </div>
        </div>
      </div>

      {/* Knowledge files drawer */}
      <AnimatePresence>
        {knowledgeOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="elevated-surface-strong rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold font-manrope text-on-surface">Knowledge Files</h3>
                <button onClick={() => setKnowledgeOpen(false)} className="text-on-surface-variant hover:text-on-surface"><X className="h-5 w-5" /></button>
              </div>
              <p className="text-[12.5px] text-on-surface-variant mb-4">Upload files to give {agent.name} specialised knowledge. Supports .txt and .md files.</p>
              {agent.knowledgeFiles.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant text-sm">No files yet</div>
              ) : (
                <div className="space-y-2 mb-4">
                  {agent.knowledgeFiles.map(f => (
                    <div key={f.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/15">
                      <BookOpen className="h-4 w-4 text-secondary shrink-0" />
                      <span className="text-[12.5px] text-on-surface flex-1 truncate">{f.name}</span>
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
