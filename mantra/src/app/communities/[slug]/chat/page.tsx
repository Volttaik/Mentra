"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MessageCircle, Loader2, Send, Bot, X,
  AlertCircle, BookOpen, ArrowUp, Users, UserPlus2, UserCheck2, ExternalLink,
  AtSign, Hash, BrainCircuit, Plus, Image as ImageIcon,
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

type MentionMenuType = "users" | "stacks" | "communities" | "quizzes";
interface MentionResult { id: string; name: string; username: string; image: string | null; }
interface StackResult { id: string; title: string; slug: string; }
interface CommunityResult { id: string; name: string; slug: string; }
interface QuizResult { id: string; title: string; stack: { title: string; slug: string }; }

function PulseDot({ delay }: { delay: number }) {
  return (
    <motion.span
      className="block w-[5px] h-[5px] rounded-full bg-secondary/60"
      animate={{ opacity: [0.2, 0.9, 0.2], scale: [0.85, 1.1, 0.85] }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut", delay }}
    />
  );
}

function renderMentions(text: string): React.ReactNode {
  const parts = text.split(/(@\w+|\[\[stack:[^\]]+\]\]|\[\[community:[^\]]+\]\]|\[\[quiz:[^\]]+\]\])/g);
  return parts.map((p, i) => {
    if (p.startsWith("@")) {
      return <span key={i} className="font-semibold text-primary">{p}</span>;
    }
    const stackM = p.match(/^\[\[stack:([^|]+)\|([^\]]+)\]\]$/);
    if (stackM) return (
      <Link key={i} href={`/stacks/${stackM[1]}`} className="inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 text-primary">
        <Hash className="w-3 h-3" />{stackM[2]}
      </Link>
    );
    const comM = p.match(/^\[\[community:([^|]+)\|([^\]]+)\]\]$/);
    if (comM) return (
      <Link key={i} href={`/communities/${comM[1]}`} className="inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 text-emerald-400">
        <Users className="w-3 h-3" />{comM[2]}
      </Link>
    );
    const quizM = p.match(/^\[\[quiz:([^|]+)\|([^\]]+)\]\]$/);
    if (quizM) return (
      <Link key={i} href={`/quiz/${quizM[1]}`} className="inline-flex items-center gap-0.5 font-semibold underline underline-offset-2 text-amber-400">
        <BrainCircuit className="w-3 h-3" />{quizM[2]}
      </Link>
    );
    return <span key={i}>{p}</span>;
  });
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
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mention system
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionMenuType, setMentionMenuType] = useState<MentionMenuType>("stacks");
  const [mentionMenuResults, setMentionMenuResults] = useState<(MentionResult | StackResult | CommunityResult | QuizResult)[]>([]);
  const [mentionMenuQuery, setMentionMenuQuery] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionResult[]>([]);

  const [showAi, setShowAi] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [aiCredits, setAiCredits] = useState(0);
  const aiBottomRef = useRef<HTMLDivElement>(null);
  const aiTextareaRef = useRef<HTMLTextAreaElement>(null);

  const [avatarCtx, setAvatarCtx] = useState<{
    user: ChatMessage["user"]; x: number; y: number; isFollowing: boolean | null;
  } | null>(null);
  const avatarLpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const avatarTouchCoords = useRef({ x: 0, y: 0 });

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

  // Mention autocomplete (@ key)
  useEffect(() => {
    if (mentionQuery === null) { setMentionResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/dm/search?q=${encodeURIComponent(mentionQuery)}`)
        .then(r => r.json()).then(d => setMentionResults(d.users ?? [])).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [mentionQuery]);

  // Mention picker search
  useEffect(() => {
    if (!showMentionMenu) return;
    const endpoint = `/api/dm/search?type=${mentionMenuType}&q=${encodeURIComponent(mentionMenuQuery)}`;
    fetch(endpoint).then(r => r.json()).then(d => {
      if (mentionMenuType === "users") setMentionMenuResults(d.users ?? []);
      else if (mentionMenuType === "stacks") setMentionMenuResults(d.stacks ?? []);
      else if (mentionMenuType === "communities") setMentionMenuResults(d.communities ?? []);
      else setMentionMenuResults(d.quizzes ?? []);
    }).catch(() => {});
  }, [showMentionMenu, mentionMenuType, mentionMenuQuery]);

  const handleInputChange = (val: string) => {
    setChatInput(val);
    const atMatch = val.match(/@(\w*)$/);
    if (atMatch) setMentionQuery(atMatch[1]);
    else setMentionQuery(null);
  };

  const insertMention = (username: string) => {
    const newInput = chatInput.replace(/@\w*$/, `@${username} `);
    setChatInput(newInput);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const insertMentionItem = (item: MentionResult | StackResult | CommunityResult | QuizResult) => {
    let tag = "";
    if ("username" in item) {
      tag = `@${(item as MentionResult).username}`;
    } else if ("slug" in item && "title" in item && !("name" in item)) {
      tag = `[[stack:${(item as StackResult).slug}|${(item as StackResult).title}]]`;
    } else if ("slug" in item && "name" in item) {
      tag = `[[community:${(item as CommunityResult).slug}|${(item as CommunityResult).name}]]`;
    } else {
      const q = item as QuizResult;
      tag = `[[quiz:${q.id}|${q.title}]]`;
    }
    setChatInput(prev => (prev.trim() ? prev + " " + tag + " " : tag + " "));
    setShowMentionMenu(false);
    inputRef.current?.focus();
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || sending) return;
    setSending(true);
    const content = chatInput.trim();
    setChatInput("");
    setMentionQuery(null);
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

  const openAvatarCtxMenu = async (user: ChatMessage["user"], x: number, y: number) => {
    const myId = (session?.user as { id?: string })?.id;
    if (user.id === myId) return;
    setAvatarCtx({ user, x, y, isFollowing: null });
    try {
      const res = await fetch(`/api/profile/${user.username}`);
      const data = await res.json();
      setAvatarCtx(prev => prev ? { ...prev, isFollowing: data.isFollowing ?? false } : null);
    } catch { /* ignore */ }
  };

  const handleAvatarFollow = async () => {
    if (!avatarCtx) return;
    const was = avatarCtx.isFollowing;
    setAvatarCtx(c => c ? { ...c, isFollowing: null } : null);
    const res = await fetch(`/api/profile/${avatarCtx.user.username}/follow`, { method: "POST" });
    const data = await res.json();
    setAvatarCtx(c => c ? { ...c, isFollowing: data.following ?? !was } : null);
  };

  const handleAvatarMessage = async () => {
    if (!avatarCtx) return;
    const targetId = avatarCtx.user.id;
    setAvatarCtx(null);
    const res = await fetch("/api/dm/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: targetId }),
    });
    const data = await res.json();
    if (data.conversation?.id) router.push(`/messages/${data.conversation.id}`);
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
    <div
      className="h-screen flex flex-col bg-background overflow-hidden"
      onClick={() => { setShowPlusMenu(false); setShowMentionMenu(false); }}
    >
      <Navbar />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full min-h-0 relative">
        <ChatBackground />
        {/* Header */}
        <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center gap-3 bg-surface-container-low shrink-0 relative z-10">
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
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0 relative z-0">
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
                    <div
                      className="w-7 h-7 rounded-full bg-secondary-container flex items-center justify-center overflow-hidden text-[10px] font-bold font-manrope text-on-secondary-container shrink-0 cursor-pointer select-none"
                      onClick={() => router.push(`/profile/${msg.user.username}`)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        openAvatarCtxMenu(msg.user, e.clientX, e.clientY);
                      }}
                      onTouchStart={(e) => {
                        const t = e.touches[0];
                        avatarTouchCoords.current = { x: t.clientX, y: t.clientY };
                        avatarLpTimer.current = setTimeout(() => {
                          openAvatarCtxMenu(msg.user, avatarTouchCoords.current.x, avatarTouchCoords.current.y);
                        }, 500);
                      }}
                      onTouchEnd={() => { if (avatarLpTimer.current) clearTimeout(avatarLpTimer.current); }}
                      onTouchMove={() => { if (avatarLpTimer.current) clearTimeout(avatarLpTimer.current); }}
                    >
                      {msg.user.image
                        ? <img src={msg.user.image} alt="" className="w-full h-full object-cover" />
                        : msg.user.name.slice(0, 2).toUpperCase()
                      }
                    </div>
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
                      {renderMentions(msg.content)}
                    </div>
                    <p className="text-[10px] text-on-surface-variant/50 mt-1 px-1">{timeAgo(msg.createdAt)}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Mention autocomplete */}
        <AnimatePresence>
          {mentionQuery !== null && mentionResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              className="absolute left-3 right-3 z-20 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden"
              style={{ bottom: "calc(64px + 4px)" }}
            >
              {mentionResults.slice(0, 5).map(u => (
                <button key={u.id} onClick={() => insertMention(u.username)}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-container transition-colors text-left">
                  <div className="w-7 h-7 rounded-full bg-secondary-container overflow-hidden shrink-0">
                    {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-on-secondary-container">{u.name[0]}</span>}
                  </div>
                  <span className="text-sm font-semibold text-on-surface">{u.name}</span>
                  <span className="text-xs text-on-surface-variant ml-auto">@{u.username}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mention picker */}
        <AnimatePresence>
          {showMentionMenu && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMentionMenu(false)} className="fixed inset-0 z-30" />
              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                onClick={e => e.stopPropagation()}
                className="absolute bottom-[68px] left-3 right-3 z-40 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl overflow-hidden"
              >
                <div className="flex border-b border-outline-variant/15">
                  {(["users", "stacks", "communities", "quizzes"] as MentionMenuType[]).map(t => (
                    <button key={t} onClick={() => { setMentionMenuType(t); setMentionMenuQuery(""); }}
                      className={cn("flex-1 text-[11px] font-semibold py-2.5 capitalize transition-colors", mentionMenuType === t ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface")}>
                      {t === "users" ? <AtSign className="w-3.5 h-3.5 mx-auto" /> : t === "stacks" ? <Hash className="w-3.5 h-3.5 mx-auto" /> : t === "communities" ? <Users className="w-3.5 h-3.5 mx-auto" /> : <BrainCircuit className="w-3.5 h-3.5 mx-auto" />}
                    </button>
                  ))}
                </div>
                <div className="px-3 pt-2 pb-1">
                  <input autoFocus value={mentionMenuQuery} onChange={e => setMentionMenuQuery(e.target.value)}
                    placeholder={`Search ${mentionMenuType}...`}
                    className="w-full bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none border border-outline-variant/15" />
                </div>
                <div className="max-h-48 overflow-y-auto pb-2">
                  {mentionMenuResults.length === 0 ? (
                    <p className="text-center text-xs text-on-surface-variant/50 py-4">No results</p>
                  ) : mentionMenuResults.map((item, i) => {
                    if (mentionMenuType === "users") {
                      const u = item as MentionResult;
                      return (
                        <button key={i} onClick={() => insertMentionItem(u)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left">
                          <div className="w-6 h-6 rounded-full bg-secondary-container overflow-hidden shrink-0">
                            {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-on-secondary-container">{u.name[0]}</span>}
                          </div>
                          <span className="flex-1 truncate">{u.name}</span>
                          <span className="text-xs text-on-surface-variant">@{u.username}</span>
                        </button>
                      );
                    } else if (mentionMenuType === "stacks") {
                      const s = item as StackResult;
                      return <button key={i} onClick={() => insertMentionItem(s)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left"><Hash className="w-3.5 h-3.5 text-primary shrink-0" />{s.title}</button>;
                    } else if (mentionMenuType === "communities") {
                      const c = item as CommunityResult;
                      return <button key={i} onClick={() => insertMentionItem(c)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left"><Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{c.name}</button>;
                    } else {
                      const q = item as QuizResult;
                      return <button key={i} onClick={() => insertMentionItem(q)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left"><BrainCircuit className="w-3.5 h-3.5 text-amber-500 shrink-0" />{q.title}<span className="text-xs text-on-surface-variant ml-1">· {q.stack?.title}</span></button>;
                    }
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Input */}
        <div className="px-4 py-3 border-t border-outline-variant/10 shrink-0 bg-surface-container-low relative z-10">
          <div className="flex items-end gap-2">
            {/* + button */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowPlusMenu(m => !m); setShowMentionMenu(false); }}
                className={cn("p-2 rounded-xl transition-colors shrink-0 mb-0.5", showPlusMenu ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container hover:text-primary")}
              >
                <Plus className="w-5 h-5" />
              </button>
              <AnimatePresence>
                {showPlusMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: 8 }}
                    transition={{ duration: 0.15 }}
                    onClick={e => e.stopPropagation()}
                    className="absolute bottom-full left-0 mb-2 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden min-w-[160px] z-50"
                  >
                    <button onClick={() => { setShowPlusMenu(false); setShowMentionMenu(true); setMentionMenuType("stacks"); setMentionMenuQuery(""); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors text-left">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><AtSign className="w-4 h-4 text-primary" /></div>
                      <span className="font-medium">Mention</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={chatInput}
              onChange={e => {
                handleInputChange(e.target.value);
                const el = e.target;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 100) + "px";
              }}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Say something…"
              rows={1}
              style={{ resize: "none", minHeight: "40px", maxHeight: "100px" }}
              className="flex-1 bg-surface-container border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-secondary/30 placeholder:text-on-surface-variant/50 text-on-surface"
            />
            <button
              onClick={sendMessage}
              disabled={!chatInput.trim() || sending}
              className="p-2.5 bg-secondary text-on-secondary rounded-xl hover:opacity-90 transition-all disabled:opacity-50 shrink-0 mb-0.5"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Avatar context menu */}
      <AnimatePresence>
        {avatarCtx && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50"
              onClick={() => setAvatarCtx(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="fixed z-50 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl overflow-hidden w-52"
              style={{
                left: Math.min(avatarCtx.x, (typeof window !== "undefined" ? window.innerWidth : 400) - 224),
                top: Math.min(avatarCtx.y, (typeof window !== "undefined" ? window.innerHeight : 600) - 180),
              }}
            >
              <div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-outline-variant/10 bg-surface-container/40">
                <div className="w-8 h-8 rounded-full bg-secondary-container overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-bold text-on-secondary-container">
                  {avatarCtx.user.image
                    ? <img src={avatarCtx.user.image} alt="" className="w-full h-full object-cover" />
                    : avatarCtx.user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-on-surface truncate">{avatarCtx.user.name}</p>
                  <p className="text-[10px] text-on-surface-variant truncate">@{avatarCtx.user.username}</p>
                </div>
              </div>

              <button
                onClick={() => { router.push(`/profile/${avatarCtx.user.username}`); setAvatarCtx(null); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                View profile
              </button>

              <button
                onClick={handleAvatarFollow}
                disabled={avatarCtx.isFollowing === null}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface transition-colors disabled:opacity-50"
              >
                {avatarCtx.isFollowing === null
                  ? <div className="w-3.5 h-3.5 border border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                  : avatarCtx.isFollowing
                  ? <UserCheck2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  : <UserPlus2 className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />}
                {avatarCtx.isFollowing === null ? "Loading…" : avatarCtx.isFollowing ? "Unfollow" : "Follow"}
              </button>

              <button
                onClick={handleAvatarMessage}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                Message
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI overlay panel */}
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
