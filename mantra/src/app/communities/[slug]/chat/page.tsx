"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MessageCircle, Loader2, Send, Bot, X,
  AlertCircle, BookOpen, ArrowUp, Users,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import ChatBackground from "@/components/chat/ChatBackground";

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; username: string; image: string | null };
}

interface AiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function PulseDot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="block w-[5px] h-[5px] rounded-full bg-secondary/60"
      animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.85, 1.1, 0.85] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

export default function CommunityChatPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: session } = useSession();
  const router = useRouter();

  const [communityName, setCommunityName] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatPollRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showAi, setShowAi] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [aiCredits, setAiCredits] = useState(0);
  const aiBottomRef = useRef<HTMLDivElement>(null);
  const aiTextareaRef = useRef<HTMLTextAreaElement>(null);

  const loadMessages = useCallback(() => {
    fetch(`/api/communities/${slug}/chat`)
      .then(r => r.json())
      .then(d => { if (!d.error) setMessages(d.messages ?? []); })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/communities/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setCommunityName(d.name);
          setMemberCount(d._count?.members ?? 0);
          setIsMember(!!d.myRole);
        } else {
          setIsMember(false);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!isMember) return;
    setChatLoading(true);
    fetch(`/api/communities/${slug}/chat`)
      .then(r => r.json())
      .then(d => { if (!d.error) setMessages(d.messages ?? []); })
      .finally(() => setChatLoading(false));
    chatPollRef.current = setInterval(loadMessages, 3000);
    return () => { if (chatPollRef.current) clearInterval(chatPollRef.current); };
  }, [isMember, slug, loadMessages]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    aiBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, aiThinking]);

  useEffect(() => {
    fetch("/api/credits").then(r => r.json()).then(d => { if (!d.error) setAiCredits(d.credits ?? 0); }).catch(() => {});
  }, []);

  const sendMessage = async () => {
    if (!chatInput.trim() || sending) return;
    setSending(true);
    const content = chatInput.trim();
    setChatInput("");
    try {
      const res = await fetch(`/api/communities/${slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const d = await res.json();
      if (!d.error) setMessages(prev => [...prev, d.message]);
    } catch { /* ignore */ }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const sendAiMessage = async () => {
    const text = aiInput.trim();
    if (!text || aiThinking) return;
    setAiInput("");
    const userMsg: AiMessage = { id: `u-${Date.now()}`, role: "user", content: text };
    setAiMessages(prev => [...prev, userMsg]);
    setAiThinking(true);
    try {
      const history = [...aiMessages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`/api/communities/${slug}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      if (!res.ok) { setAiMessages(prev => [...prev, { id: `e-${Date.now()}`, role: "assistant", content: data.error ?? "Something went wrong." }]); return; }
      setAiMessages(prev => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: data.reply }]);
      if (data.creditsRemaining !== undefined) setAiCredits(data.creditsRemaining);
    } catch {
      setAiMessages(prev => [...prev, { id: `e-${Date.now()}`, role: "assistant", content: "Connection error. Please try again." }]);
    } finally {
      setAiThinking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-secondary animate-spin" />
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
          <AlertCircle className="w-10 h-10 text-outline-variant" />
          <p className="text-on-surface-variant">Sign in to access community chat.</p>
          <Link href="/auth/signin" className="btn-primary">Sign in</Link>
        </div>
      </div>
    );
  }

  if (isMember === false) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-6">
          <AlertCircle className="w-10 h-10 text-outline-variant" />
          <p className="text-on-surface-variant">You need to be a member to view this community&apos;s chat.</p>
          <button onClick={() => router.push(`/communities/${slug}`)} className="btn-primary">View community</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full min-h-0 relative">
        <ChatBackground />
        {/* Header */}
        <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center gap-3 bg-surface-container-low shrink-0">
          <button
            onClick={() => router.push(`/communities/${slug}`)}
            className="p-1.5 rounded-xl hover:bg-surface-container text-on-surface-variant transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 bg-secondary-container rounded-xl flex items-center justify-center shrink-0">
            <MessageCircle className="w-4 h-4 text-on-secondary-container" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-manrope font-semibold text-sm text-primary truncate">{communityName || "Community"}</p>
            <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
              <Users className="w-3 h-3" />{memberCount} members
            </p>
          </div>
          <button
            onClick={() => setShowAi(v => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
              showAi
                ? "bg-secondary-container border-secondary/30 text-on-secondary-container"
                : "border-outline-variant/30 text-on-surface-variant hover:bg-surface-container hover:border-secondary/30 hover:text-secondary"
            )}
          >
            <Bot className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0">
          {chatLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 text-secondary animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <MessageCircle className="w-12 h-12 text-outline-variant mx-auto mb-3" />
              <p className="text-on-surface-variant font-medium">No messages yet</p>
              <p className="text-xs text-on-surface-variant/60 mt-1">Be the first to say hello!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.user.id === session?.user?.id;
              const showAvatar = i === 0 || messages[i - 1].user.id !== msg.user.id;
              return (
                <div key={msg.id} className={cn("flex items-end gap-2.5", isMe && "flex-row-reverse")}>
                  {showAvatar ? (
                    <Link href={`/profile/${msg.user.username}`}>
                      <div className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden text-[10px] font-bold font-manrope text-on-secondary-container shrink-0">
                        {msg.user.image
                          ? <img src={msg.user.image} alt="" className="w-full h-full object-cover" />
                          : msg.user.name.slice(0, 2).toUpperCase()
                        }
                      </div>
                    </Link>
                  ) : (
                    <div className="w-7 shrink-0" />
                  )}
                  <div className={cn("max-w-xs md:max-w-md lg:max-w-lg", isMe && "items-end flex flex-col")}>
                    {showAvatar && (
                      <p className={cn("text-[11px] text-on-surface-variant mb-1 font-medium", isMe && "text-right")}>
                        {isMe ? "You" : msg.user.name}
                      </p>
                    )}
                    <div className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      isMe
                        ? "bg-secondary text-on-secondary rounded-br-sm"
                        : "bg-surface-container text-on-surface rounded-bl-sm"
                    )}>
                      {msg.content}
                    </div>
                    <p className="text-[10px] text-on-surface-variant/50 mt-1 px-1">{timeAgo(msg.createdAt)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-outline-variant/10 shrink-0 bg-surface-container-low">
          <form
            onSubmit={e => { e.preventDefault(); sendMessage(); }}
            className="flex items-center gap-3"
          >
            <input
              ref={inputRef}
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Say something…"
              className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary/30 placeholder:text-on-surface-variant/50"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || sending}
              className="p-2.5 bg-secondary text-on-secondary rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>

      {/* AI overlay panel — fixed, floats above chat, does NOT push content */}
      <AnimatePresence>
        {showAi && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setShowAi(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 h-full w-full max-w-[400px] z-[60] flex flex-col bg-background border-l border-outline-variant/20 shadow-2xl"
            >
              {/* AI panel header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-outline-variant/10 bg-surface-container-low shrink-0">
                <div className="w-8 h-8 rounded-xl bg-secondary-container flex items-center justify-center relative shrink-0">
                  <Bot className="w-4 h-4 text-on-secondary-container" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-background" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-manrope font-semibold text-sm text-primary">AI Assistant</p>
                  <p className="text-[11px] text-on-surface-variant">{aiCredits} credits remaining</p>
                </div>
                <button
                  onClick={() => setShowAi(false)}
                  className="p-2 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* AI Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
                {aiMessages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-full text-center pt-6 pb-4"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-secondary-container/40 border border-secondary/20 flex items-center justify-center mb-4">
                      <BookOpen className="w-7 h-7 text-secondary/70" />
                    </div>
                    <h3 className="font-manrope font-semibold text-sm text-primary mb-1.5">Ask anything</h3>
                    <p className="text-xs text-on-surface-variant max-w-[220px] leading-relaxed mb-6">
                      Get help drafting messages, summarising discussions, or brainstorming ideas for this community.
                    </p>
                    <div className="flex flex-col gap-2 w-full">
                      {[
                        "Summarise the recent chat",
                        "Suggest a discussion topic",
                        "Help me write an announcement",
                      ].map(s => (
                        <button
                          key={s}
                          onClick={() => { setAiInput(s); aiTextareaRef.current?.focus(); }}
                          className="text-left px-3.5 py-2.5 rounded-xl bg-surface-container border border-outline-variant/20 text-xs text-on-surface-variant hover:text-primary hover:bg-surface-container-high hover:border-secondary/30 transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
                <AnimatePresence initial={false}>
                  {aiMessages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                    >
                      <div className={cn(
                        "max-w-[85%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed",
                        msg.role === "user"
                          ? "bg-primary text-on-primary rounded-tr-sm"
                          : "bg-surface-container border border-outline-variant/15 text-on-surface rounded-tl-sm"
                      )}>
                        {msg.content}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {aiThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-surface-container border border-outline-variant/10 w-fit"
                  >
                    <PulseDot delay={0} />
                    <PulseDot delay={0.18} />
                    <PulseDot delay={0.36} />
                  </motion.div>
                )}
                <div ref={aiBottomRef} />
              </div>

              {/* AI Input */}
              <div className="px-4 py-4 border-t border-outline-variant/10 bg-surface-container-low shrink-0">
                <div className={cn(
                  "rounded-2xl border bg-surface-container-lowest transition-all duration-200",
                  aiInput.trim() ? "border-secondary/30 shadow-sm" : "border-outline-variant/20"
                )}>
                  <textarea
                    ref={aiTextareaRef}
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }}
                    placeholder="Ask the AI…"
                    disabled={aiThinking}
                    rows={1}
                    className="w-full px-4 pt-3 pb-1 text-[13px] bg-transparent resize-none focus:outline-none placeholder:text-on-surface-variant/40 disabled:opacity-40 min-h-[44px] max-h-[120px] leading-relaxed text-on-surface"
                    style={{ height: "auto" }}
                    onInput={e => {
                      const el = e.currentTarget;
                      el.style.height = "auto";
                      el.style.height = Math.min(el.scrollHeight, 120) + "px";
                    }}
                  />
                  <div className="flex items-center justify-end px-3 pb-3 pt-1">
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={sendAiMessage}
                      disabled={!aiInput.trim() || aiThinking}
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200",
                        aiInput.trim() && !aiThinking
                          ? "bg-primary text-on-primary hover:opacity-90 shadow-sm"
                          : "bg-surface-container text-on-surface-variant/30"
                      )}
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
