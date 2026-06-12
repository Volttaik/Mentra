"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Pencil, Trash2, Reply, Copy, Eye,
  EyeOff, Check, CheckCheck, Palette, X,
  Hash, Users, BrainCircuit, BadgeCheck, Upload,
  AtSign,
} from "lucide-react";
import Link from "next/link";
import ChatBackground, { CHAT_BG_OPTIONS, type ChatBgId } from "@/components/chat/ChatBackground";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";

interface DMSender { id: string; name: string; username: string; image: string | null; }
interface DMReplyTo { id: string; content: string; deletedAt: string | null; isViewOnce: boolean; sender: { id: string; name: string }; }
interface DM {
  id: string; conversationId: string; senderId: string; content: string;
  isViewOnce: boolean; viewedAt: string | null; editedAt: string | null;
  deletedAt: string | null; replyToId: string | null;
  replyTo: DMReplyTo | null; sender: DMSender; createdAt: string;
}
interface OtherUser { id: string; name: string; username: string; image: string | null; isVerified: boolean; }
interface MentionResult { id: string; name: string; username: string; image: string | null; }
interface StackResult { id: string; title: string; slug: string; }
interface CommunityResult { id: string; name: string; slug: string; }
interface QuizResult { id: string; title: string; stack: { title: string; slug: string }; }

type ContextMenu = { msgId: string; x: number; y: number; isMine: boolean; content: string; deletedAt: string | null; editedAt: string | null; isViewOnce: boolean; };
type MentionMenuType = "stacks" | "communities" | "quizzes";

function Avatar({ user, size = "sm" }: { user: { name: string; image: string | null }; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-8 h-8 text-[10px]" : "w-10 h-10 text-xs";
  const initials = user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className={cn("rounded-full bg-secondary-container flex items-center justify-center overflow-hidden shrink-0", sz)}>
      {user.image
        ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
        : <span className="font-bold text-on-secondary-container font-manrope">{initials}</span>}
    </div>
  );
}

function ViewOnceMessage({ msg, isMine, onView }: { msg: DM; isMine: boolean; onView: () => void }) {
  if (msg.deletedAt) return <span className="italic text-on-surface-variant/50 text-xs">[deleted]</span>;
  if (isMine) {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Eye className="w-3.5 h-3.5 opacity-70" />
        <span>{msg.viewedAt ? "Viewed" : "View once · not yet viewed"}</span>
      </div>
    );
  }
  if (msg.viewedAt) {
    return (
      <div className="flex items-center gap-2 text-xs opacity-60">
        <EyeOff className="w-3.5 h-3.5" />
        <span>Opened</span>
      </div>
    );
  }
  return (
    <button
      onClick={onView}
      className="flex items-center gap-2 text-xs font-semibold animate-pulse"
    >
      <Eye className="w-4 h-4" />
      Tap to view · view once
    </button>
  );
}

function renderMentions(text: string): React.ReactNode {
  const parts = text.split(/(@\w+|\[\[stack:[^\]]+\]\]|\[\[community:[^\]]+\]\]|\[\[quiz:[^\]]+\]\])/g);
  return parts.map((p, i) => {
    if (p.startsWith("@")) return <span key={i} className="text-primary font-semibold">{p}</span>;
    const stackM = p.match(/^\[\[stack:([^|]+)\|([^\]]+)\]\]$/);
    if (stackM) return <Link key={i} href={`/stacks/${stackM[1]}`} className="inline-flex items-center gap-1 text-primary font-semibold underline underline-offset-2"><Hash className="w-3 h-3" />{stackM[2]}</Link>;
    const comM = p.match(/^\[\[community:([^|]+)\|([^\]]+)\]\]$/);
    if (comM) return <Link key={i} href={`/communities/${comM[1]}`} className="inline-flex items-center gap-1 text-emerald-500 font-semibold underline underline-offset-2"><Users className="w-3 h-3" />{comM[2]}</Link>;
    const quizM = p.match(/^\[\[quiz:([^|]+)\|([^\]]+)\]\]$/);
    if (quizM) return <Link key={i} href={`/quiz/${quizM[1]}`} className="inline-flex items-center gap-1 text-amber-500 font-semibold underline underline-offset-2"><BrainCircuit className="w-3 h-3" />{quizM[2]}</Link>;
    return <span key={i}>{p}</span>;
  });
}

export default function DMChatPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const myId = (session?.user as { id?: string })?.id ?? "";

  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [messages, setMessages] = useState<DM[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<DM | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [ctxMenu, setCtxMenu] = useState<ContextMenu | null>(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [bgPreset, setBgPreset] = useState<ChatBgId>("none");
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionResults, setMentionResults] = useState<MentionResult[]>([]);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionMenuType, setMentionMenuType] = useState<MentionMenuType>("stacks");
  const [mentionMenuResults, setMentionMenuResults] = useState<(StackResult | CommunityResult | QuizResult)[]>([]);
  const [mentionMenuQuery, setMentionMenuQuery] = useState("");
  const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bgFileRef = useRef<HTMLInputElement>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    try {
      const preset = localStorage.getItem(`dm-bg-${id}`) as ChatBgId | null;
      if (preset) setBgPreset(preset);
      const img = localStorage.getItem(`dm-bg-img-${id}`);
      if (img) setCustomBgUrl(img);
    } catch { /* ignore */ }
  }, [id]);

  useEffect(() => {
    if (!myId) return;
    const es = new EventSource(`/api/dm/conversations/${id}/stream`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "init") {
          setMessages(data.messages ?? []);
        } else if (data.type === "update") {
          setMessages(prev => {
            const updated = [...prev];
            for (const msg of (data.messages as DM[])) {
              const idx = updated.findIndex(m => m.id === msg.id);
              if (idx >= 0) updated[idx] = msg;
              else updated.push(msg);
            }
            return updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          });
        }
      } catch { /* ignore */ }
    };

    es.onerror = () => { es.close(); };

    return () => { es.close(); esRef.current = null; };
  }, [id, myId]);

  useEffect(() => {
    fetch(`/api/dm/conversations`)
      .then(r => r.json())
      .then(d => {
        const convo = (d.conversations ?? []).find((c: { id: string; otherUser: OtherUser }) => c.id === id);
        if (convo) setOtherUser(convo.otherUser);
        else router.push("/messages");
      })
      .catch(() => {});
  }, [id, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (mentionQuery === null) { setMentionResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/dm/search?q=${encodeURIComponent(mentionQuery)}`)
        .then(r => r.json())
        .then(d => setMentionResults(d.users ?? []))
        .catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [mentionQuery]);

  useEffect(() => {
    if (!showMentionMenu) return;
    fetch(`/api/dm/search?type=${mentionMenuType}&q=${encodeURIComponent(mentionMenuQuery)}`)
      .then(r => r.json())
      .then(d => {
        if (mentionMenuType === "stacks") setMentionMenuResults(d.stacks ?? []);
        else if (mentionMenuType === "communities") setMentionMenuResults(d.communities ?? []);
        else setMentionMenuResults(d.quizzes ?? []);
      })
      .catch(() => {});
  }, [showMentionMenu, mentionMenuType, mentionMenuQuery]);

  const handleInputChange = (val: string) => {
    setInput(val);
    const atMatch = val.match(/@(\w*)$/);
    if (atMatch) setMentionQuery(atMatch[1]);
    else setMentionQuery(null);
  };

  const insertMention = (username: string) => {
    const newInput = input.replace(/@\w*$/, `@${username} `);
    setInput(newInput);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const insertMentionItem = (item: StackResult | CommunityResult | QuizResult) => {
    let tag = "";
    if ("slug" in item && "title" in item && !("name" in item)) {
      tag = `[[stack:${(item as StackResult).slug}|${(item as StackResult).title}]]`;
    } else if ("slug" in item && "name" in item) {
      tag = `[[community:${(item as CommunityResult).slug}|${(item as CommunityResult).name}]]`;
    } else {
      const q = item as QuizResult;
      tag = `[[quiz:${q.id}|${q.title}]]`;
    }
    setInput(prev => prev + " " + tag + " ");
    setShowMentionMenu(false);
    inputRef.current?.focus();
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    setReplyTo(null);
    setMentionQuery(null);
    await fetch(`/api/dm/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, replyToId: replyTo?.id ?? null }),
    });
    setSending(false);
  };

  const saveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    await fetch(`/api/dm/conversations/${id}/messages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: editingId, content: editContent.trim() }),
    });
    setEditingId(null);
    setEditContent("");
  };

  const deleteMessage = async (msgId: string) => {
    setCtxMenu(null);
    await fetch(`/api/dm/conversations/${id}/messages?messageId=${msgId}`, { method: "DELETE" });
  };

  const viewOnce = async (msgId: string) => {
    await fetch(`/api/dm/conversations/${id}/view-once`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msgId }),
    });
  };

  const openCtxMenu = useCallback((msg: DM, x: number, y: number) => {
    setCtxMenu({ msgId: msg.id, x, y, isMine: msg.senderId === myId, content: msg.content, deletedAt: msg.deletedAt, editedAt: msg.editedAt, isViewOnce: msg.isViewOnce });
  }, [myId]);

  const handleLongPressStart = (msg: DM, e: React.TouchEvent) => {
    const touch = e.touches[0];
    const timer = setTimeout(() => openCtxMenu(msg, touch.clientX, touch.clientY), 500);
    setLongPressTimer(timer);
  };
  const handleLongPressEnd = () => {
    if (longPressTimer) { clearTimeout(longPressTimer); setLongPressTimer(null); }
  };

  const applyBgPreset = (preset: ChatBgId) => {
    setBgPreset(preset);
    setCustomBgUrl(null);
    localStorage.setItem(`dm-bg-${id}`, preset);
    localStorage.removeItem(`dm-bg-img-${id}`);
  };

  const uploadCustomBg = async (file: File) => {
    setUploadingBg(true);
    const form = new FormData();
    form.append("file", file);
    form.append("type", "chat-bg");
    const res = await fetch("/api/upload", { method: "POST", body: form }).then(r => r.json()).catch(() => null);
    if (res?.url) {
      setCustomBgUrl(res.url);
      setBgPreset("none");
      localStorage.setItem(`dm-bg-img-${id}`, res.url);
      localStorage.removeItem(`dm-bg-${id}`);
    }
    setUploadingBg(false);
  };

  const groupByDate = (msgs: DM[]) => {
    const groups: { date: string; msgs: DM[] }[] = [];
    let lastDate = "";
    for (const m of msgs) {
      const d = new Date(m.createdAt).toDateString();
      if (d !== lastDate) { groups.push({ date: d, msgs: [] }); lastDate = d; }
      groups[groups.length - 1].msgs.push(m);
    }
    return groups;
  };

  const dateLabel = (d: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (d === today) return "Today";
    if (d === yesterday) return "Yesterday";
    return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  const groups = groupByDate(messages);

  if (!otherUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background" onClick={() => { setCtxMenu(null); setShowMentionMenu(false); }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/20 z-20 shrink-0">
        <button onClick={() => router.push("/messages")} className="p-2 -ml-1 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Link href={`/profile/${otherUser.username}`} className="flex items-center gap-2.5 flex-1 min-w-0">
          <Avatar user={otherUser} size="md" />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-sm text-on-surface font-manrope truncate">{otherUser.name}</span>
              {otherUser.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
            </div>
            <p className="text-xs text-on-surface-variant truncate">@{otherUser.username}</p>
          </div>
        </Link>
        <button
          onClick={(e) => { e.stopPropagation(); setShowBgPicker(b => !b); }}
          className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container transition-colors"
          title="Chat background"
        >
          <Palette className="w-4.5 h-4.5 w-[18px] h-[18px]" />
        </button>
      </div>

      {/* ── Background picker panel ─────────────────────────────────── */}
      <AnimatePresence>
        {showBgPicker && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            onClick={e => e.stopPropagation()}
            className="absolute top-[64px] right-4 z-30 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-xl p-4 w-72"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-on-surface uppercase tracking-wider">Chat Background</span>
              <button onClick={() => setShowBgPicker(false)} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {CHAT_BG_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => applyBgPreset(opt.id)}
                  className={cn(
                    "aspect-video rounded-xl overflow-hidden border-2 transition-all",
                    bgPreset === opt.id && !customBgUrl ? "border-primary shadow-md" : "border-transparent hover:border-outline-variant/40"
                  )}
                  title={opt.label}
                >
                  {opt.thumbnail}
                </button>
              ))}
            </div>
            <div className="border-t border-outline-variant/15 pt-3 space-y-2">
              <button
                onClick={() => bgFileRef.current?.click()}
                disabled={uploadingBg}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-sm text-on-surface-variant transition-colors"
              >
                {uploadingBg ? <div className="w-3.5 h-3.5 border border-primary border-t-transparent rounded-full animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {customBgUrl ? "Change custom image" : "Upload custom image"}
              </button>
              {(customBgUrl || bgPreset !== "none") && (
                <button
                  onClick={() => { applyBgPreset("none"); setCustomBgUrl(null); localStorage.removeItem(`dm-bg-img-${id}`); }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-surface-container text-sm text-on-surface-variant/70 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove background
                </button>
              )}
            </div>
            <input ref={bgFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) uploadCustomBg(f); e.target.value = ""; }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages area ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto relative">
        {/* Background */}
        {customBgUrl ? (
          <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: `url(${customBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        ) : (
          <ChatBackground bgId={bgPreset} />
        )}

        <div className="relative z-10 flex flex-col gap-0.5 px-3 py-4 min-h-full">
          {groups.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-16 text-center gap-3">
              <div className="w-16 h-16 rounded-3xl bg-secondary-container/40 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-secondary/50" />
              </div>
              <p className="text-sm text-on-surface-variant">Say hi to {otherUser.name}!</p>
            </div>
          )}

          {groups.map(group => (
            <div key={group.date}>
              <div className="flex justify-center my-3">
                <span className="text-[10px] font-medium text-on-surface-variant/60 bg-surface-container-lowest/80 backdrop-blur-sm px-3 py-1 rounded-full border border-outline-variant/15">
                  {dateLabel(group.date)}
                </span>
              </div>
              {group.msgs.map(msg => {
                const isMine = msg.senderId === myId;
                const isDeleted = !!msg.deletedAt;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className={cn("flex items-end gap-2 mb-1", isMine ? "flex-row-reverse" : "flex-row")}
                    onTouchStart={!isDeleted ? (e) => handleLongPressStart(msg, e) : undefined}
                    onTouchEnd={handleLongPressEnd}
                    onTouchMove={handleLongPressEnd}
                    onContextMenu={!isDeleted ? (e) => { e.preventDefault(); e.stopPropagation(); openCtxMenu(msg, e.clientX, e.clientY); } : undefined}
                  >
                    {!isMine && <Avatar user={msg.sender} size="sm" />}

                    <div className={cn("flex flex-col max-w-[72%]", isMine ? "items-end" : "items-start")}>
                      {/* Reply preview */}
                      {msg.replyTo && (
                        <div className={cn(
                          "text-[10px] px-2.5 py-1.5 rounded-t-xl mb-0.5 border-l-2 max-w-full truncate",
                          isMine
                            ? "bg-primary/10 border-primary/40 text-primary/70"
                            : "bg-surface-container border-outline-variant/40 text-on-surface-variant"
                        )}>
                          <span className="font-semibold">{msg.replyTo.sender.name}</span>
                          {" · "}
                          {msg.replyTo.deletedAt ? "[deleted]" : msg.replyTo.isViewOnce ? "📷 View once" : msg.replyTo.content.slice(0, 60)}
                        </div>
                      )}

                      {/* Bubble */}
                      <div className={cn(
                        "relative px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed select-none cursor-default",
                        isMine
                          ? "bg-primary text-on-primary rounded-br-sm"
                          : "bg-surface-container-low text-on-surface rounded-bl-sm border border-outline-variant/15",
                        isDeleted && "opacity-50",
                        msg.isViewOnce && !isDeleted && !isMine && !msg.viewedAt && "ring-2 ring-primary/30"
                      )}>
                        {editingId === msg.id ? (
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <input
                              autoFocus
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") { setEditingId(null); } }}
                              className="bg-transparent outline-none flex-1 text-sm min-w-0"
                            />
                            <button onClick={saveEdit} className="shrink-0 opacity-80 hover:opacity-100"><Check className="w-4 h-4" /></button>
                          </div>
                        ) : isDeleted ? (
                          <span className="italic opacity-50 text-xs">This message was deleted</span>
                        ) : msg.isViewOnce ? (
                          <ViewOnceMessage msg={msg} isMine={isMine} onView={() => viewOnce(msg.id)} />
                        ) : (
                          <div className="break-words">{renderMentions(msg.content)}</div>
                        )}
                      </div>

                      {/* Meta */}
                      <div className={cn("flex items-center gap-1 mt-0.5 px-1", isMine ? "flex-row-reverse" : "flex-row")}>
                        <span className="text-[10px] text-on-surface-variant/40">{timeAgo(msg.createdAt)}</span>
                        {msg.editedAt && <span className="text-[10px] text-on-surface-variant/30">(edited)</span>}
                        {isMine && <CheckCheck className="w-3 h-3 text-primary/40" />}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Context menu ───────────────────────────────────────────── */}
      <AnimatePresence>
        {ctxMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.12 }}
            onClick={e => e.stopPropagation()}
            className="fixed z-50 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl py-1 min-w-[160px]"
            style={{
              left: Math.min(ctxMenu.x, window.innerWidth - 180),
              top: Math.min(ctxMenu.y, window.innerHeight - 280),
            }}
          >
            {[
              { icon: Reply, label: "Reply", action: () => { const m = messages.find(m => m.id === ctxMenu.msgId); if (m) setReplyTo(m); setCtxMenu(null); }, always: true },
              { icon: Copy, label: "Copy", action: () => { navigator.clipboard.writeText(ctxMenu.content); setCtxMenu(null); }, always: !ctxMenu.isViewOnce },
              { icon: Pencil, label: "Edit", action: () => { setEditingId(ctxMenu.msgId); setEditContent(ctxMenu.content); setCtxMenu(null); }, always: ctxMenu.isMine && !ctxMenu.deletedAt && !ctxMenu.isViewOnce },
              { icon: Trash2, label: "Delete", action: () => deleteMessage(ctxMenu.msgId), always: ctxMenu.isMine && !ctxMenu.deletedAt, danger: true },
            ].filter(item => item.always).map(item => (
              <button
                key={item.label}
                onClick={item.action}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-surface-container",
                  item.danger ? "text-red-500" : "text-on-surface"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mention picker (users) ───────────────────────────────── */}
      <AnimatePresence>
        {mentionQuery !== null && mentionResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full left-3 right-3 mb-1 z-20 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden"
            style={{ bottom: "calc(var(--input-height, 72px) + 4px)" }}
          >
            {mentionResults.slice(0, 5).map(u => (
              <button
                key={u.id}
                onClick={() => insertMention(u.username)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-surface-container transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-full bg-secondary-container overflow-hidden shrink-0">
                  {u.image ? <img src={u.image} alt={u.name} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-[9px] font-bold text-on-secondary-container">{u.name[0]}</span>}
                </div>
                <div>
                  <span className="text-sm font-semibold text-on-surface">{u.name}</span>
                  <span className="text-xs text-on-surface-variant ml-1">@{u.username}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mention menu (stacks / communities / quizzes) ─────────── */}
      <AnimatePresence>
        {showMentionMenu && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMentionMenu(false)} className="fixed inset-0 z-30" />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="absolute bottom-[76px] left-3 right-3 z-40 bg-surface-container-lowest border border-outline-variant/20 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="flex border-b border-outline-variant/15">
                {(["stacks", "communities", "quizzes"] as MentionMenuType[]).map(t => (
                  <button key={t} onClick={() => setMentionMenuType(t)} className={cn("flex-1 text-xs font-semibold py-2.5 capitalize transition-colors", mentionMenuType === t ? "text-primary border-b-2 border-primary" : "text-on-surface-variant hover:text-on-surface")}>
                    {t}
                  </button>
                ))}
              </div>
              <div className="px-3 pt-2 pb-1">
                <input
                  autoFocus
                  value={mentionMenuQuery}
                  onChange={e => setMentionMenuQuery(e.target.value)}
                  placeholder={`Search ${mentionMenuType}...`}
                  className="w-full bg-surface-container rounded-xl px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none border border-outline-variant/15"
                />
              </div>
              <div className="max-h-48 overflow-y-auto pb-2">
                {mentionMenuResults.length === 0 ? (
                  <p className="text-center text-xs text-on-surface-variant/50 py-4">No results</p>
                ) : mentionMenuResults.map((item, i) => {
                  if (mentionMenuType === "stacks") {
                    const s = item as StackResult;
                    return <button key={i} onClick={() => insertMentionItem(s)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left"><Hash className="w-3.5 h-3.5 text-primary shrink-0" />{s.title}</button>;
                  } else if (mentionMenuType === "communities") {
                    const c = item as CommunityResult;
                    return <button key={i} onClick={() => insertMentionItem(c)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left"><Users className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{c.name}</button>;
                  } else {
                    const q = item as QuizResult;
                    return <button key={i} onClick={() => insertMentionItem(q)} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-surface-container text-sm text-on-surface text-left"><BrainCircuit className="w-3.5 h-3.5 text-amber-500 shrink-0" />{q.title} <span className="text-xs text-on-surface-variant ml-1">· {q.stack?.title}</span></button>;
                  }
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Input area ─────────────────────────────────────────────── */}
      <div className="shrink-0 bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/20 px-3 py-2.5 z-20">
        {/* Reply preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mb-2 pl-3 border-l-2 border-primary/50"
            >
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold text-primary">{replyTo.sender.name}</span>
                <p className="text-[11px] text-on-surface-variant truncate">{replyTo.content}</p>
              </div>
              <button onClick={() => setReplyTo(null)} className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant/50 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-end gap-2">
          {/* Mention stacks/communities/quizzes button */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowMentionMenu(m => !m); }}
            className="p-2 rounded-xl text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors shrink-0 mb-0.5"
            title="Mention stack, community, or quiz"
          >
            <AtSign className="w-5 h-5" />
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (editingId) saveEdit(); else sendMessage(); }
              if (e.key === "Escape" && editingId) { setEditingId(null); setEditContent(""); }
            }}
            placeholder={editingId ? "Editing message..." : `Message ${otherUser.name}...`}
            rows={1}
            className="flex-1 bg-surface-container border border-outline-variant/20 rounded-2xl px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/40 outline-none resize-none focus:border-primary/40 transition-colors max-h-32 overflow-y-auto leading-relaxed"
            style={{ scrollbarWidth: "none" }}
          />

          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={editingId ? saveEdit : sendMessage}
            disabled={sending || (!input.trim() && !editingId)}
            className={cn(
              "p-2.5 rounded-xl transition-all shrink-0 mb-0.5",
              (input.trim() || editingId)
                ? "bg-primary text-on-primary shadow-md"
                : "bg-surface-container text-on-surface-variant/40"
            )}
          >
            {editingId ? <Check className="w-5 h-5" /> : <Send className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function MessageCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
    </svg>
  );
}
